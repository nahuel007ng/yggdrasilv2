import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.messaging.registry import registry
from app.services.notifications import (
    build_evening_habits,
    build_morning_summary,
    get_due_reminders,
)
from app.services.badges import check_zero_overdue_badge
from app.services.titles import check_and_award_titles

logger = logging.getLogger(__name__)


async def _get_recipient_id(channel: str | None = None) -> tuple[str | None, str | None]:
    """Obtiene el ID del destinatario y el canal desde user_profile.

    Returns:
        Tupla (recipient_id, channel). Si channel es None, usa preferred_channel.
    """
    from app.db.supabase import get_supabase

    # Fallback rapido desde config (legacy)
    if channel is None and settings.telegram_chat_id:
        return str(settings.telegram_chat_id), "telegram"

    supabase = get_supabase()
    result = (
        supabase.table("user_profile")
        .select("telegram_chat_id, whatsapp_jid, preferred_channel")
        .limit(1)
        .execute()
    )

    if not result.data:
        return None, None

    profile = result.data[0]
    ch = channel or profile.get("preferred_channel", "telegram")

    if ch == "whatsapp" and profile.get("whatsapp_jid"):
        return profile["whatsapp_jid"], "whatsapp"
    elif profile.get("telegram_chat_id"):
        return str(profile["telegram_chat_id"]), "telegram"

    return None, None


async def _send_message(text: str) -> None:
    """Envia un mensaje al usuario via el canal preferido."""
    recipient_id, channel = await _get_recipient_id()
    if not recipient_id:
        logger.warning("No hay recipient_id disponible para enviar notificacion")
        return

    await registry.send_message(recipient_id, text, channel=channel)
    logger.info("Notificacion enviada a %s via %s", recipient_id, channel)


async def job_morning_summary() -> None:
    """Job: resumen matutino."""
    logger.info("Ejecutando job: resumen matutino")
    try:
        message = await build_morning_summary()
        if message:
            await _send_message(message)
        else:
            logger.info("Resumen matutino: nada para reportar")
    except Exception:
        logger.exception("Error en job_morning_summary")


async def job_check_reminders() -> None:
    """Job: check de recordatorios puntuales cada 5 min."""
    try:
        messages = await get_due_reminders()
        for msg in messages:
            await _send_message(msg)
        if messages:
            logger.info("Disparados %d recordatorios puntuales", len(messages))
    except Exception:
        logger.exception("Error en job_check_reminders")


async def job_check_pending_transactions() -> None:
    """Job: recordatorios de transacciones pendientes cuya fecha esperada es hoy."""
    logger.info("Ejecutando job: check transacciones pendientes")
    try:
        from datetime import date as date_type

        from app.db.supabase import get_supabase

        supabase = get_supabase()
        today = date_type.today().isoformat()

        pending = (
            supabase.table("transactions")
            .select("*")
            .eq("status", "pending")
            .eq("expected_date", today)
            .execute()
        )

        for tx in pending.data:
            tipo = "cobrar" if tx["type"] == "income" else "pagar"
            amount = tx["amount"]
            desc = tx.get("description", "")
            msg = (
                f"📋 Hoy esperabas {tipo} ${amount:,.0f}"
                f"{' — ' + desc if desc else ''}.\n"
                f"¿Se concretó? Respondé sí/no (podés ajustar el monto, ej: 'sí pero a 600mil')"
                f"\n\n_ID: {tx['id']}_"
            )
            await _send_message(msg)

        if pending.data:
            logger.info("Enviados %d recordatorios de transacciones pendientes", len(pending.data))
    except Exception:
        logger.exception("Error en job_check_pending_transactions")


async def job_generate_daily_quests() -> None:
    """Job: genera misiones diarias para todos los usuarios activos a las 4:00 AM."""
    logger.info("Ejecutando job: generacion de daily quests")
    try:
        from app.db.supabase import get_supabase
        from app.services.daily_quests import generate_daily_quests

        supabase = get_supabase()
        profiles = supabase.table("user_profile").select("user_id").execute()
        for profile in profiles.data or []:
            await generate_daily_quests(user_id=profile["user_id"])
        logger.info("Daily quests generadas para %d usuarios", len(profiles.data or []))
    except Exception:
        logger.exception("Error en job_generate_daily_quests")


async def job_evening_habits() -> None:
    """Job: habitos pendientes vespertino."""
    logger.info("Ejecutando job: habitos pendientes vespertino")
    try:
        message = await build_evening_habits()
        if message:
            await _send_message(message)
        else:
            logger.info("Habitos vespertinos: todos completos, no se envia mensaje")
    except Exception:
        logger.exception("Error en job_evening_habits")


async def job_check_overdue_badge():
    """22:00 — otorga 'Orden del Fénix' si no hay tareas vencidas y re-chequea títulos."""
    logger.info("Ejecutando job: check_overdue_badge + titulos")
    try:
        badge = await check_zero_overdue_badge()
        titles = await check_and_award_titles()
        if badge or titles:
            names = ([badge["name"]] if badge else []) + [t["name"] for t in titles]
            await _send_message(f"🏆 ¡Desbloqueaste: {', '.join(names)}!")
    except Exception:
        logger.exception("Error en job_check_overdue_badge")


def start_scheduler() -> AsyncIOScheduler:
    """Configura e inicia el scheduler con los 6 jobs de notificaciones."""
    scheduler = AsyncIOScheduler()
    tz = settings.notification_timezone

    # 1. Resumen matutino
    scheduler.add_job(
        job_morning_summary,
        trigger=CronTrigger(hour=settings.notification_morning_hour, minute=0, timezone=tz),
        id="morning_summary",
        name="Resumen matutino",
        replace_existing=True,
    )

    # 2. Check recordatorios puntuales (cada 5 min)
    scheduler.add_job(
        job_check_reminders,
        trigger=IntervalTrigger(minutes=5),
        id="check_reminders",
        name="Check recordatorios puntuales",
        replace_existing=True,
    )

    # 3. Habitos pendientes vespertino
    scheduler.add_job(
        job_evening_habits,
        trigger=CronTrigger(hour=settings.notification_evening_hour, minute=0, timezone=tz),
        id="evening_habits",
        name="Habitos pendientes vespertino",
        replace_existing=True,
    )

    # 4. Transacciones pendientes (junto con resumen matutino, 9:05 AM)
    scheduler.add_job(
        job_check_pending_transactions,
        trigger=CronTrigger(hour=9, minute=5, timezone=tz),
        id="check_pending_transactions",
        name="Check transacciones pendientes",
        replace_existing=True,
    )

    # 5. Daily quests (4:00 AM)
    scheduler.add_job(
        job_generate_daily_quests,
        trigger=CronTrigger(hour=4, minute=0, timezone=tz),
        id="generate_daily_quests",
        name="Generacion daily quests",
        replace_existing=True,
    )

    # 6. Badge tareas vencidas + títulos (22:00)
    scheduler.add_job(
        job_check_overdue_badge,
        trigger=CronTrigger(hour=22, minute=0, timezone=tz),
        id="check_overdue_badge",
        name="Badge tareas vencidas + títulos",
        replace_existing=True,
    )

    scheduler.start()
    logger.info(
        "Scheduler iniciado con 6 jobs: matutino (%s:00), recordatorios (cada 5min), vespertino (%s:00), tx pendientes (9:05), daily quests (4:00), overdue badge + títulos (22:00) [TZ: %s]",
        settings.notification_morning_hour,
        settings.notification_evening_hour,
        tz,
    )
    return scheduler
