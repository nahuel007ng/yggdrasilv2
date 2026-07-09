import math

from app.db.supabase import get_supabase, get_user_id
from app.models.schemas import ActionType

XP_REWARDS: dict[ActionType, int] = {
    ActionType.ADD_EXPENSE: 10,
    ActionType.TOGGLE_HABIT: 15,
    ActionType.ADD_TASK: 5,
    ActionType.LOG_STUDY: 20,
    ActionType.LOG_WORKOUT: 20,
    ActionType.SET_REMINDER: 5,
    ActionType.QUERY_DATA: 0,
    ActionType.UNKNOWN: 0,
}


def calculate_level(total_xp: int) -> int:
    """Calcula el nivel actual dado el XP total.

    Formula: XP(n) = 100 * n * (n+1) / 2
    Inversa: n = floor((-1 + sqrt(1 + 8 * total_xp / 100)) / 2)
    """
    if total_xp <= 0:
        return 0
    n = (-1 + math.sqrt(1 + 8 * total_xp / 100)) / 2
    return int(n)


def xp_for_level(level: int) -> int:
    """XP total necesario para alcanzar un nivel."""
    if level <= 0:
        return 0
    return 100 * level * (level + 1) // 2


async def award_xp(action_type: ActionType, source_id: str | None = None) -> dict:
    """Registra XP por una accion y actualiza el perfil del usuario."""
    xp_amount = XP_REWARDS.get(action_type, 0)
    if xp_amount == 0:
        return {"xp_awarded": 0, "leveled_up": False}

    supabase = get_supabase()

    # 1. Log xp_event
    supabase.table("xp_events").insert({
        "source": action_type.value,
        "source_id": source_id,
        "amount": xp_amount,
        "user_id": get_user_id(),
    }).execute()

    # 2. Leer perfil actual
    profile = supabase.table("user_profile").select("id, total_xp, current_level").execute()
    profile_data = profile.data[0]
    old_total = profile_data["total_xp"] or 0
    old_level = calculate_level(old_total)

    # 3. Calcular nuevos valores
    new_total = old_total + xp_amount
    new_level = calculate_level(new_total)
    leveled_up = new_level > old_level

    # 4. Actualizar perfil
    supabase.table("user_profile").update({
        "total_xp": new_total,
        "current_level": new_level,
    }).eq("id", profile_data["id"]).execute()

    # 5. Info para el bot
    next_level_xp = xp_for_level(new_level + 1)
    return {
        "xp_awarded": xp_amount,
        "total_xp": new_total,
        "current_level": new_level,
        "xp_for_next_level": next_level_xp,
        "xp_progress": f"{new_total}/{next_level_xp}",
        "leveled_up": leveled_up,
        "new_level": new_level if leveled_up else None,
    }


async def get_user_stats() -> dict:
    """Devuelve stats actuales del usuario para /stats o respuestas."""
    supabase = get_supabase()
    profile = supabase.table("user_profile").select("total_xp, current_level").execute()
    data = profile.data[0]
    total_xp = data["total_xp"] or 0
    level = data["current_level"] or 0
    next_level_xp = xp_for_level(level + 1)
    return {
        "total_xp": total_xp,
        "current_level": level,
        "xp_for_next_level": next_level_xp,
        "xp_progress": f"{total_xp}/{next_level_xp}",
    }
