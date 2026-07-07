from enum import Enum

from app.db.supabase import get_supabase
from app.models.schemas import ActionType


class BadgeCode(str, Enum):
    """Codigos de todos los badges del sistema."""

    # Primeros pasos
    FIRST_EXPENSE = "first_expense"
    FIRST_HABIT = "first_habit"
    FIRST_TASK = "first_task"
    FIRST_STUDY = "first_study"
    FIRST_WORKOUT = "first_workout"
    # Rachas
    STREAK_7 = "streak_7"
    STREAK_30 = "streak_30"
    PERFECT_WEEK = "perfect_week"
    # Niveles / XP
    LEVEL_5 = "level_5"
    LEVEL_10 = "level_10"
    LEVEL_25 = "level_25"
    XP_1000 = "xp_1000"
    # Dominio-especificos
    STUDY_10H = "study_10h"
    WORKOUT_30 = "workout_30"
    ALL_ROUNDER = "all_rounder"


# Display names para feedback al usuario
BADGE_NAMES: dict[BadgeCode, str] = {
    BadgeCode.FIRST_EXPENSE: "Primer gasto",
    BadgeCode.FIRST_HABIT: "Primer hábito",
    BadgeCode.FIRST_TASK: "Primera tarea",
    BadgeCode.FIRST_STUDY: "Primera sesión",
    BadgeCode.FIRST_WORKOUT: "Primer entrenamiento",
    BadgeCode.STREAK_7: "Semana de fuego",
    BadgeCode.STREAK_30: "Mes imparable",
    BadgeCode.PERFECT_WEEK: "Semana perfecta",
    BadgeCode.LEVEL_5: "Nivel 5",
    BadgeCode.LEVEL_10: "Nivel 10",
    BadgeCode.LEVEL_25: "Nivel 25",
    BadgeCode.XP_1000: "Mil puntos",
    BadgeCode.STUDY_10H: "Diez horas de estudio",
    BadgeCode.WORKOUT_30: "30 entrenamientos",
    BadgeCode.ALL_ROUNDER: "Todoterreno",
}

# Mapeo: ActionType → lista de BadgeCodes a chequear
# Evita chequear los 15 badges en cada accion
BADGES_BY_ACTION: dict[ActionType, list[BadgeCode]] = {
    ActionType.ADD_EXPENSE: [
        BadgeCode.FIRST_EXPENSE,
        BadgeCode.ALL_ROUNDER,
    ],
    ActionType.TOGGLE_HABIT: [
        BadgeCode.FIRST_HABIT,
        BadgeCode.STREAK_7,
        BadgeCode.STREAK_30,
        BadgeCode.PERFECT_WEEK,
        BadgeCode.ALL_ROUNDER,
    ],
    ActionType.ADD_TASK: [
        BadgeCode.FIRST_TASK,
        BadgeCode.ALL_ROUNDER,
    ],
    ActionType.LOG_STUDY: [
        BadgeCode.FIRST_STUDY,
        BadgeCode.STUDY_10H,
        BadgeCode.ALL_ROUNDER,
    ],
    ActionType.LOG_WORKOUT: [
        BadgeCode.FIRST_WORKOUT,
        BadgeCode.WORKOUT_30,
        BadgeCode.ALL_ROUNDER,
    ],
    ActionType.SET_REMINDER: [],
    ActionType.QUERY_DATA: [],
    ActionType.UNKNOWN: [],
}

# Badges que dependen de XP/nivel (se agregan si xp_result indica progreso)
LEVEL_XP_BADGES: list[BadgeCode] = [
    BadgeCode.LEVEL_5,
    BadgeCode.LEVEL_10,
    BadgeCode.LEVEL_25,
    BadgeCode.XP_1000,
]


async def check_and_award_badges(
    action_type: ActionType,
    xp_result: dict | None = None,
    streak_result: dict | None = None,
    perfect_week_result: dict | None = None,
) -> list[dict]:
    """Chequea y otorga badges relevantes para la accion ejecutada.

    Args:
        action_type: tipo de accion que se acaba de ejecutar
        xp_result: resultado de award_xp() (contiene total_xp, current_level, leveled_up)
        streak_result: resultado de update_streak() (contiene current_streak)
        perfect_week_result: resultado de check_perfect_week() (contiene perfect_week)

    Returns:
        Lista de dicts con badges recien desbloqueados:
        [{"code": "first_expense", "name": "Primer gasto"}, ...]
        Lista vacia si no se desbloqueo ningun badge.
    """
    supabase = get_supabase()

    # 1. Determinar que badges chequear
    badges_to_check = list(BADGES_BY_ACTION.get(action_type, []))

    # Agregar badges de nivel/XP si hubo XP
    if xp_result and xp_result.get("xp_awarded", 0) > 0:
        badges_to_check.extend(LEVEL_XP_BADGES)

    if not badges_to_check:
        return []

    # 2. Obtener badges ya desbloqueados (para no re-otorgar)
    existing = supabase.table("badges").select("code").execute()
    existing_codes = {row["code"] for row in existing.data}

    # 3. Filtrar badges que ya estan desbloqueados
    badges_to_check = [b for b in badges_to_check if b.value not in existing_codes]

    if not badges_to_check:
        return []

    # 4. Evaluar condiciones de cada badge pendiente
    newly_awarded: list[dict] = []
    for badge_code in badges_to_check:
        if await _check_badge_condition(
            badge_code, supabase, xp_result, streak_result, perfect_week_result
        ):
            supabase.table("badges").insert(
                {"code": badge_code.value}
            ).execute()
            newly_awarded.append({
                "code": badge_code.value,
                "name": BADGE_NAMES[badge_code],
            })

    return newly_awarded


async def _check_badge_condition(
    badge_code: BadgeCode,
    supabase,
    xp_result: dict | None,
    streak_result: dict | None,
    perfect_week_result: dict | None,
) -> bool:
    """Evalua si la condicion de un badge se cumple."""

    # --- Primeros pasos ---
    if badge_code == BadgeCode.FIRST_EXPENSE:
        result = supabase.table("transactions").select("id", count="exact").limit(1).execute()
        return (result.count or 0) >= 1

    if badge_code == BadgeCode.FIRST_HABIT:
        result = (
            supabase.table("habit_records")
            .select("id", count="exact")
            .eq("completed", True)
            .limit(1)
            .execute()
        )
        return (result.count or 0) >= 1

    if badge_code == BadgeCode.FIRST_TASK:
        result = supabase.table("tasks").select("id", count="exact").limit(1).execute()
        return (result.count or 0) >= 1

    if badge_code == BadgeCode.FIRST_STUDY:
        result = supabase.table("study_sessions").select("id", count="exact").limit(1).execute()
        return (result.count or 0) >= 1

    if badge_code == BadgeCode.FIRST_WORKOUT:
        result = supabase.table("workouts").select("id", count="exact").limit(1).execute()
        return (result.count or 0) >= 1

    # --- Rachas ---
    if badge_code == BadgeCode.STREAK_7:
        if streak_result and streak_result.get("current_streak", 0) >= 7:
            return True
        # Fallback: verificar en DB si algun habito tiene streak >= 7
        result = (
            supabase.table("habits")
            .select("current_streak")
            .gte("current_streak", 7)
            .limit(1)
            .execute()
        )
        return len(result.data) > 0

    if badge_code == BadgeCode.STREAK_30:
        if streak_result and streak_result.get("current_streak", 0) >= 30:
            return True
        result = (
            supabase.table("habits")
            .select("current_streak")
            .gte("current_streak", 30)
            .limit(1)
            .execute()
        )
        return len(result.data) > 0

    if badge_code == BadgeCode.PERFECT_WEEK:
        if perfect_week_result and perfect_week_result.get("perfect_week"):
            return True
        return False

    # --- Niveles / XP ---
    if badge_code == BadgeCode.LEVEL_5:
        return xp_result is not None and xp_result.get("current_level", 0) >= 5

    if badge_code == BadgeCode.LEVEL_10:
        return xp_result is not None and xp_result.get("current_level", 0) >= 10

    if badge_code == BadgeCode.LEVEL_25:
        return xp_result is not None and xp_result.get("current_level", 0) >= 25

    if badge_code == BadgeCode.XP_1000:
        return xp_result is not None and xp_result.get("total_xp", 0) >= 1000

    # --- Dominio-especificos ---
    if badge_code == BadgeCode.STUDY_10H:
        result = (
            supabase.table("study_sessions")
            .select("duration_minutes")
            .not_.is_("duration_minutes", "null")
            .execute()
        )
        total_minutes = sum(row["duration_minutes"] for row in result.data)
        return total_minutes >= 600  # 10 horas = 600 minutos

    if badge_code == BadgeCode.WORKOUT_30:
        result = supabase.table("workouts").select("id", count="exact").execute()
        return (result.count or 0) >= 30

    if badge_code == BadgeCode.ALL_ROUNDER:
        # Verificar que haya al menos 1 registro en cada dominio
        domains: list[tuple[str, dict[str, object] | None]] = [
            ("transactions", None),
            ("habit_records", {"completed": True}),
            ("tasks", None),
            ("study_sessions", None),
            ("workouts", None),
        ]
        for table_name, extra_filter in domains:
            query = supabase.table(table_name).select("id", count="exact").limit(1)
            if extra_filter:
                for key, value in extra_filter.items():
                    query = query.eq(key, value)
            result = query.execute()
            if (result.count or 0) == 0:
                return False
        return True

    return False
