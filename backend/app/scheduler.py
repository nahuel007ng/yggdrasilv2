import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

import telegram

from app.config import settings
from app.services.notifications import (
    build_evening_habits,
    build_morning_summary,
    get_due_reminders,
)

logger = logging.getLogger(__name__)


async def _get_chat_id() -> int | None:
    """Obtiene el chat_id del usuario desde config o user_profile."""
    if settings.telegram_chat_id:
        return settings.telegram_chat_id

    from app.db.supabase import get_supabase

    supabase = get_supabase()
    result = (
        supabase.table("user_profile")
        .select("telegram_chat_id")
        .not_.is_("telegram_chat_id", "null")
        .limit(1)
        .execute()
    )
    if result.data and result.data[0].get("telegram_chat_id"):
        return int(result.data[0]["telegram_chat_id"])
    return None


async def _send_message(text: str) -> None:
    """Envia un mensaje via Telegram Bot API."""
    chat_id = await _get_chat_id()
    if not chat_id:
        logger.warning("No hay chat_id configurado — no se puede enviar notificacion")
        return

    bot = telegram.Bot(token=settings.telegram_bot_token)
    async with bot:
        await bot.send_message(chat_id=chat_id, text=text)
    logger.info("Notificacion enviada a chat_id=%s", chat_id)


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


def start_scheduler() -> AsyncIOScheduler:
    """Configura e inicia el scheduler con los 4 jobs de notificaciones."""
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

    scheduler.start()
    logger.info(
        "Scheduler iniciado con 4 jobs: matutino (%s:00), recordatorios (cada 5min), vespertino (%s:00), tx pendientes (9:05) [TZ: %s]",
        settings.notification_morning_hour,
        settings.notification_evening_hour,
        tz,
    )
    return scheduler
