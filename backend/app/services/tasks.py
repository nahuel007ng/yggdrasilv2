from app.db.supabase import get_supabase, get_user_id
from app.models.schemas import ParsedPayload


async def add_task(payload: ParsedPayload) -> dict:
    """Crea una nueva tarea en Supabase."""
    supabase = get_supabase()

    task = {
        "title": payload.task_title or payload.description or "Tarea sin título",
        "status": "todo",
        "priority": "not_urgent_not_important",
        "user_id": get_user_id(),
    }

    if payload.date:
        task["due_date"] = payload.date.isoformat()

    supabase.table("tasks").insert(task).execute()

    return {
        "success": True,
        "title": task["title"],
        "due_date": payload.date.isoformat() if payload.date else None,
    }
