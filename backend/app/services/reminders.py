from datetime import date

from app.db.supabase import get_supabase
from app.models.schemas import ParsedPayload


async def set_reminder(payload: ParsedPayload) -> dict:
    """Crea un recordatorio en Supabase."""
    supabase = get_supabase()

    description = payload.description or ""
    reminder_date = (payload.date or date.today()).isoformat()

    reminder = {
        "description": description,
        "reminder_date": reminder_date,
        "reminder_time": payload.reminder_time,
        "is_recurring": payload.is_recurring or False,
        "recurrence_rule": payload.recurrence_rule,
    }

    supabase.table("reminders").insert(reminder).execute()

    return {
        "success": True,
        "description": description,
        "reminder_date": reminder_date,
        "time": payload.reminder_time,
        "recurring": payload.is_recurring or False,
    }
