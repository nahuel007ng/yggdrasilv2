import re
import unicodedata
from datetime import date, datetime, timezone
from difflib import get_close_matches

from app.db.supabase import get_supabase, get_user_id
from app.models.schemas import ParsedPayload

# subjects.status no tiene CHECK en DB: la validación es responsabilidad del servicio.
VALID_STATUS = {"aprobada", "cursando", "pendiente"}


def _normalize(text: str) -> str:
    """lowercase + sin acentos + sin paréntesis (mismo patrón que habits._normalize)."""
    text = re.sub(r"\([^)]*\)", "", text.lower().strip())
    text = "".join(
        c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn"
    )
    return text.strip()


def _match_subject(subject_name: str, subjects: list[dict]) -> dict | None:
    """Matchea el nombre parseado contra las materias. 3 pasos, del más al menos estricto."""
    target = _normalize(subject_name)
    normalized = {_normalize(s["name"]): s for s in subjects}

    # Paso 1: igualdad normalizada ("analisis matematico i" == "Análisis Matemático I")
    if target in normalized:
        return normalized[target]

    # Paso 2: substring bidireccional, solo si es único (evita "Análisis" → I y II)
    partial = [s for norm, s in normalized.items() if target in norm or norm in target]
    if len(partial) == 1:
        return partial[0]

    # Paso 3: fuzzy ("analisis i" ~ "analisis matematico i")
    close = get_close_matches(target, list(normalized.keys()), n=1, cutoff=0.6)
    if close:
        return normalized[close[0]]

    return None


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
        "user_id": get_user_id(),
    }

    supabase.table("study_sessions").insert(session).execute()

    return {
        "success": True,
        "subject": subject["name"],
        "duration_minutes": payload.duration_minutes,
    }


async def update_subject(
    subject_name: str | None,
    new_status: str | None = None,
    grade: int | None = None,
) -> dict:
    """Actualiza estado y/o nota de una materia ("aprobé Análisis I con 8").

    Sin promoción automática: solo cambia lo que el usuario pide explícitamente.
    Matching accent-insensitive con desambiguación (no actualiza si es ambiguo).
    """
    if not subject_name:
        return {"success": False, "error": "No especificaste la materia"}

    if new_status and new_status not in VALID_STATUS:
        return {
            "success": False,
            "error": f"Estado inválido '{new_status}'. Válidos: aprobada, cursando, pendiente",
        }

    patch = {}
    if new_status:
        patch["status"] = new_status
    if grade is not None:
        patch["grade"] = grade
    if not patch:
        return {"success": False, "error": "No indicaste qué cambiar (estado o nota)"}

    supabase = get_supabase()
    result = (
        supabase.table("subjects")
        .select("id, name, status, grade")
        .eq("is_active", True)
        .execute()
    )
    subjects = result.data or []
    subject = _match_subject(subject_name, subjects)

    if subject is None:
        return {"success": False, "error": f"No encontré la materia '{subject_name}'"}

    supabase.table("subjects").update(patch).eq("id", subject["id"]).execute()

    return {
        "success": True,
        "subject": subject["name"],
        "status": patch.get("status", subject.get("status")),
        "grade": patch.get("grade", subject.get("grade")),
        "status_changed": "status" in patch,
        "grade_changed": "grade" in patch,
    }
