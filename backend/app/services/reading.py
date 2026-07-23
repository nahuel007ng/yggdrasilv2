"""Servicio de lectura: sesiones y libros (Gamificación V2.2)."""

from datetime import date as date_type
from datetime import datetime, timezone

from app.db.supabase import get_supabase, get_user_id
from app.models.schemas import ParsedPayload


def _normalize_date(raw):
    """Convierte date/datetime/str a ISO date string."""
    if raw is None:
        return None
    if isinstance(raw, date_type):
        return raw.isoformat()
    return str(raw)


async def log_reading(payload: ParsedPayload) -> dict:
    """Registra una sesión de lectura."""
    supabase = get_supabase()
    duration = payload.duration_minutes
    if not duration or duration <= 0:
        return {"success": False, "error": "duración inválida"}

    session_date = _normalize_date(payload.date) or date_type.today().isoformat()
    book_id = None
    book_title = payload.book_title
    if book_title:
        existing = (
            supabase.table("books").select("id")
            .ilike("title", book_title).limit(1).execute()
        )
        if existing.data:
            book_id = existing.data[0]["id"]
        else:
            created = supabase.table("books").insert({
                "user_id": get_user_id(),
                "title": book_title,
                "category": "otro",
                "status": "en_curso",
            }).execute()
            book_id = created.data[0]["id"]

    supabase.table("reading_sessions").insert({
        "user_id": get_user_id(),
        "book_id": book_id,
        "duration_minutes": duration,
        "date": session_date,
        "notes": payload.notes,
    }).execute()
    return {"success": True, "duration_minutes": duration, "book_title": book_title}


async def finish_book(payload: ParsedPayload) -> dict:
    """Marca un libro como terminado (lo crea si no existe)."""
    supabase = get_supabase()
    title = payload.title
    if not title:
        return {"success": False, "error": "falta el título del libro"}

    category = payload.category or "otro"
    if category not in ("clasico", "filosofia", "ciencia", "otro"):
        category = "otro"

    existing = (
        supabase.table("books").select("id, status")
        .ilike("title", title).limit(1).execute()
    )
    finished_at = datetime.now(timezone.utc).isoformat()
    now_fields = {"status": "leido", "finished_at": finished_at, "category": category}
    if existing.data:
        supabase.table("books").update(now_fields).eq("id", existing.data[0]["id"]).execute()
    else:
        supabase.table("books").insert({
            "user_id": get_user_id(),
            "title": title,
            "author": payload.author,
            "category": category,
            "status": "leido",
            "finished_at": finished_at,
        }).execute()
    return {"success": True, "title": title, "category": category}
