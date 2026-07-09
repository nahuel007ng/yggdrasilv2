import logging
from datetime import date, datetime, time, timedelta

from zoneinfo import ZoneInfo

from app.config import settings
from app.db.supabase import get_supabase, get_user_id

logger = logging.getLogger(__name__)

TZ = ZoneInfo(settings.notification_timezone)


async def build_morning_summary() -> str | None:
    """Arma el resumen matutino: habitos pendientes, tareas del dia, recordatorios, saldo."""
    supabase = get_supabase()
    today = date.today()
    tomorrow = today + timedelta(days=1)
    sections: list[str] = []

    # --- Habitos pendientes de hoy ---
    habits_result = (
        supabase.table("habits")
        .select("id, name")
        .eq("frequency", "daily")
        .eq("is_archived", False)
        .execute()
    )
    if habits_result.data:
        completed_result = (
            supabase.table("habit_records")
            .select("habit_id")
            .eq("date", today.isoformat())
            .eq("completed", True)
            .execute()
        )
        completed_ids = {r["habit_id"] for r in (completed_result.data or [])}
        pending = [h for h in habits_result.data if h["id"] not in completed_ids]
        if pending:
            lines = "\n".join(f"  - {h['name']}" for h in pending)
            sections.append(f"Habitos pendientes:\n{lines}")

    # --- Tareas con due_date hoy o manana ---
    tasks_result = (
        supabase.table("tasks")
        .select("title, due_date, status")
        .eq("is_deleted", False)
        .in_("status", ["todo", "doing"])
        .execute()
    )
    if tasks_result.data:
        due_tasks = []
        for t in tasks_result.data:
            if t.get("due_date"):
                due_str = t["due_date"][:10]  # YYYY-MM-DD
                if due_str == today.isoformat():
                    due_tasks.append(f"  - {t['title']} (vence hoy)")
                elif due_str == tomorrow.isoformat():
                    due_tasks.append(f"  - {t['title']} (vence manana)")
        if due_tasks:
            sections.append("Tareas para hoy/manana:\n" + "\n".join(due_tasks))

    # --- Recordatorios del dia ---
    reminders_result = (
        supabase.table("reminders")
        .select("description, reminder_time")
        .eq("reminder_date", today.isoformat())
        .eq("is_completed", False)
        .execute()
    )
    if reminders_result.data:
        lines = []
        for r in reminders_result.data:
            time_str = f" a las {r['reminder_time']}" if r.get("reminder_time") else ""
            lines.append(f"  - {r['description']}{time_str}")
        sections.append("Recordatorios:\n" + "\n".join(lines))

    # --- Saldo disponible ---
    accounts_result = (
        supabase.table("accounts")
        .select("balance")
        .eq("is_default", True)
        .execute()
    )
    if accounts_result.data:
        balance = accounts_result.data[0].get("balance", 0)
        sections.append(f"Saldo disponible: ${balance:,.0f}")

    if not sections:
        return None

    return "Buenos dias! Tu resumen de hoy:\n\n" + "\n\n".join(sections)


async def get_due_reminders() -> list[str]:
    """Obtiene recordatorios con hora vencida, los marca completados, y reagenda recurrentes."""
    supabase = get_supabase()
    now = datetime.now(TZ)
    today = now.date()
    current_time = now.time().replace(microsecond=0)

    # Recordatorios de hoy con hora <= ahora, no completados
    result = (
        supabase.table("reminders")
        .select("id, description, reminder_time, is_recurring, recurrence_rule")
        .eq("reminder_date", today.isoformat())
        .eq("is_completed", False)
        .execute()
    )

    messages: list[str] = []
    if not result.data:
        return messages

    for reminder in result.data:
        # Si tiene hora, verificar que ya paso
        if reminder.get("reminder_time"):
            reminder_time = time.fromisoformat(reminder["reminder_time"])
            if reminder_time > current_time:
                continue

        # Marcar como completado
        supabase.table("reminders").update({"is_completed": True}).eq("id", reminder["id"]).execute()

        messages.append(f"Recordatorio: {reminder['description']}")

        # Reagendar si es recurrente
        if reminder.get("is_recurring") and reminder.get("recurrence_rule"):
            next_date = _calculate_next_date(today, reminder["recurrence_rule"])
            if next_date:
                supabase.table("reminders").insert({
                    "description": reminder["description"],
                    "reminder_date": next_date.isoformat(),
                    "reminder_time": reminder.get("reminder_time"),
                    "is_recurring": True,
                    "recurrence_rule": reminder["recurrence_rule"],
                    "is_completed": False,
                    "user_id": get_user_id(),
                }).execute()
                logger.info(
                    "Recordatorio recurrente '%s' reagendado para %s",
                    reminder["description"],
                    next_date,
                )

    return messages


async def build_evening_habits() -> str | None:
    """Arma mensaje vespertino de habitos pendientes. None si todos completos."""
    supabase = get_supabase()
    today = date.today()

    habits_result = (
        supabase.table("habits")
        .select("id, name")
        .eq("frequency", "daily")
        .eq("is_archived", False)
        .execute()
    )
    if not habits_result.data:
        return None

    completed_result = (
        supabase.table("habit_records")
        .select("habit_id")
        .eq("date", today.isoformat())
        .eq("completed", True)
        .execute()
    )
    completed_ids = {r["habit_id"] for r in (completed_result.data or [])}
    pending = [h for h in habits_result.data if h["id"] not in completed_ids]

    if not pending:
        return None

    lines = "\n".join(f"  - {h['name']}" for h in pending)
    return (
        f"Todavia te faltan {len(pending)} habitos para hoy:\n\n"
        f"{lines}\n\n"
        "Dale que se puede!"
    )


def _calculate_next_date(current_date: date, rule: str) -> date | None:
    """Calcula la proxima fecha segun la regla de recurrencia."""
    rule = rule.lower().strip()

    if rule == "daily":
        return current_date + timedelta(days=1)

    if rule == "weekly":
        return current_date + timedelta(weeks=1)

    if rule.startswith("monthly_"):
        # monthly_21 → dia 21 del proximo mes
        try:
            day = int(rule.split("_")[1])
        except (IndexError, ValueError):
            return None
        year = current_date.year
        month = current_date.month + 1
        if month > 12:
            month = 1
            year += 1
        # Clamp day to max days in month
        import calendar
        max_day = calendar.monthrange(year, month)[1]
        day = min(day, max_day)
        return date(year, month, day)

    return None
