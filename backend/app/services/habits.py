from app.db.supabase import get_supabase, get_user_id
from app.models.schemas import ParsedPayload
from app.services.streaks import check_perfect_week, get_habit_date, update_streak


async def toggle_habit(payload: ParsedPayload) -> dict:
    """Marca un hábito como completado para hoy."""
    supabase = get_supabase()
    today = (payload.date or get_habit_date()).isoformat()

    # Buscar hábito por nombre (case-insensitive, búsqueda parcial)
    habit_name = payload.habit_name or ""
    result = (
        supabase.table("habits")
        .select("id, name")
        .ilike("name", f"%{habit_name}%")
        .eq("is_archived", False)
        .execute()
    )

    if not result.data:
        return {"success": False, "error": f"No encontré un hábito que coincida con '{habit_name}'"}

    habit = result.data[0]

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
