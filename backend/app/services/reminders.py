import unicodedata
from datetime import date

from app.db.supabase import get_supabase, get_user_id
from app.models.schemas import ParsedPayload


def _normalize(text: str) -> str:
    """Normaliza texto: quita acentos y pasa a minúsculas."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


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
        "remind_before_minutes": payload.remind_before_minutes or 0,
        "user_id": get_user_id(),
    }

    supabase.table("reminders").insert(reminder).execute()

    remind_before = payload.remind_before_minutes or 0
    return {
        "success": True,
        "description": description,
        "reminder_date": reminder_date,
        "time": payload.reminder_time,
        "recurring": payload.is_recurring or False,
        "remind_before_minutes": remind_before,
    }


async def delete_reminder(payload: ParsedPayload) -> dict:
    """Elimina un recordatorio por descripción (match parcial, accent-insensitive)."""
    supabase = get_supabase()
    description = payload.description or ""

    # Traer todos los recordatorios activos y matchear en Python (accent-insensitive)
    result = (
        supabase.table("reminders")
        .select("id, description, reminder_date, reminder_time, is_recurring")
        .eq("is_completed", False)
        .eq("user_id", get_user_id())
        .execute()
    )

    if not result.data:
        return {"success": False, "error": "not_found", "description": description}

    # Match parcial accent-insensitive
    search = _normalize(description)
    matched = [r for r in result.data if search in _normalize(r["description"])]

    if not matched:
        return {"success": False, "error": "not_found", "description": description}

    if len(matched) > 1:
        # Si todos los matches tienen la misma descripción normalizada, son duplicados — eliminar el primero
        unique_descs = {_normalize(r["description"]) for r in matched}
        if len(unique_descs) > 1:
            matches = [
                f"- {r['description']} ({r['reminder_date']})"
                for r in matched[:5]
            ]
            return {
                "success": False,
                "error": "ambiguous",
                "matches": matches,
                "description": description,
            }

    # Match único (o duplicados con misma descripción): soft delete via is_completed
    reminder = matched[0]
    supabase.table("reminders").update({"is_completed": True}).eq("id", reminder["id"]).execute()

    return {
        "success": True,
        "description": reminder["description"],
        "reminder_date": reminder["reminder_date"],
        "was_recurring": reminder.get("is_recurring", False),
    }


async def list_reminders() -> dict:
    """Lista recordatorios activos (no completados)."""
    supabase = get_supabase()
    result = (
        supabase.table("reminders")
        .select("description, reminder_date, reminder_time, is_recurring, recurrence_rule")
        .eq("is_completed", False)
        .eq("user_id", get_user_id())
        .order("reminder_date")
        .execute()
    )

    reminders = []
    for r in (result.data or []):
        time_str = f" a las {r['reminder_time']}" if r.get("reminder_time") else ""
        recurring_str = " (recurrente)" if r.get("is_recurring") else ""
        reminders.append(f"- {r['description']}: {r['reminder_date']}{time_str}{recurring_str}")

    return {
        "success": True,
        "reminders": reminders,
        "count": len(reminders),
    }
