from datetime import date, datetime, timezone

from app.db.supabase import get_supabase
from app.models.schemas import ParsedPayload


async def log_study(payload: ParsedPayload) -> dict:
    """Registra una sesion de estudio en Supabase."""
    supabase = get_supabase()

    # Buscar materia por nombre
    if not payload.subject_name:
        return {"success": False, "error": "No especificaste la materia"}

    result = (
        supabase.table("subjects")
        .select("id, name")
        .ilike("name", f"%{payload.subject_name}%")
        .eq("is_active", True)
        .execute()
    )
    if not result.data:
        return {"success": False, "error": f"No encontre la materia '{payload.subject_name}'"}

    subject = result.data[0]

    # Buscar topic si se especifico
    topic_id = None
    if payload.topic_name:
        topic_result = (
            supabase.table("topics")
            .select("id")
            .eq("subject_id", subject["id"])
            .ilike("name", f"%{payload.topic_name}%")
            .execute()
        )
        if topic_result.data:
            topic_id = topic_result.data[0]["id"]

    # Fecha de la sesion
    session_date = payload.date or date.today()
    start_time = datetime.combine(session_date, datetime.min.time(), tzinfo=timezone.utc).isoformat()

    # Insertar sesion
    session = {
        "subject_id": subject["id"],
        "topic_id": topic_id,
        "start_time": start_time,
        "duration_minutes": payload.duration_minutes or 0,
        "notes": payload.notes,
    }

    supabase.table("study_sessions").insert(session).execute()

    return {
        "success": True,
        "subject": subject["name"],
        "duration_minutes": payload.duration_minutes,
    }
