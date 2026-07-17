import re
import unicodedata
from difflib import get_close_matches

from app.db.supabase import get_supabase, get_user_id
from app.models.schemas import ParsedPayload
from app.services.streaks import check_perfect_week, get_habit_date, update_streak


def _normalize(text: str) -> str:
    """lowercase + sin acentos + sin paréntesis ni contenido extra."""
    text = text.lower().strip()
    text = re.sub(r"\([^)]*\)", "", text)
    text = "".join(
        c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn"
    )
    return text.strip()


def _match_habit(habit_name: str, habits: list[dict]) -> dict | None:
    """Matchea el nombre parseado contra los hábitos de DB. 3 pasos, del más al menos estricto."""
    target = _normalize(habit_name)
    normalized = {_normalize(h["name"]): h for h in habits}

    # Paso 1: igualdad normalizada ("meditacion" == "meditación")
    if target in normalized:
        return normalized[target]

    # Paso 2: substring bidireccional ("agua" está en "agua (8 vasos)")
    for norm_name, habit in normalized.items():
        if target in norm_name or norm_name in target:
            return habit

    # Paso 3: fuzzy ("meditar" ~ "meditacion")
    close = get_close_matches(target, list(normalized.keys()), n=1, cutoff=0.6)
    if close:
        return normalized[close[0]]

    return None


async def toggle_habit(payload: ParsedPayload) -> dict:
    """Marca un hábito como completado para hoy."""
    supabase = get_supabase()
    today = (payload.date or get_habit_date()).isoformat()

    habit_name = payload.habit_name or ""
    result = (
        supabase.table("habits")
        .select("id, name")
        .eq("is_archived", False)
        .execute()
    )
    habits = result.data or []
    habit = _match_habit(habit_name, habits)

    if habit is None:
        names = ", ".join(h["name"] for h in habits) or "ninguno"
        return {
            "success": False,
            "error": f"No encontré un hábito parecido a '{habit_name}'. Tus hábitos son: {names}",
        }

    # Verificar si ya existe un registro para hoy
    existing = (
        supabase.table("habit_records")
        .select("id")
        .eq("habit_id", habit["id"])
        .eq("date", today)
        .execute()
    )

    if existing.data:
        # Ya existe — toggle: marcar como no completado si estaba completado
        supabase.table("habit_records").update({"completed": True}).eq("id", existing.data[0]["id"]).execute()
    else:
        # Crear nuevo registro
        supabase.table("habit_records").insert({
            "habit_id": habit["id"],
            "date": today,
            "completed": True,
            "user_id": get_user_id(),
        }).execute()

    # Actualizar racha y verificar semana perfecta
    streak_result = await update_streak(habit["id"])
    week_result = await check_perfect_week()

    return {
        "success": True,
        "habit_id": habit["id"],
        "habit_name": habit["name"],
        "date": today,
        "streak": streak_result,
        "perfect_week": week_result,
    }
