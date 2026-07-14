from datetime import date
from enum import Enum

from app.db.supabase import get_supabase, get_user_id
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
    # XP
    XP_1000 = "xp_1000"
    # Rangos
    RANK_DESPERTADO = "rank_despertado"
    RANK_MAESTRO = "rank_maestro"
    RANK_SANTO = "rank_santo"
    RANK_SOBERANO = "rank_soberano"
    RANK_ESPIRITU = "rank_espiritu"
    RANK_DIOS = "rank_dios"
    # Dominio-especificos
    STUDY_10H = "study_10h"
    WORKOUT_30 = "workout_30"
    ALL_ROUNDER = "all_rounder"
    # Ruta del Erudito (nuevos)
    STUDY_50H = "study_50h"
    STUDY_100H = "study_100h"
    STUDY_250H = "study_250h"
    STUDY_500H = "study_500h"
    # Ruta del Guerrero (nuevos)
    WORKOUT_60 = "workout_60"
    WORKOUT_90 = "workout_90"
    WORKOUT_120 = "workout_120"
    WORKOUT_150 = "workout_150"
    WORKOUT_200 = "workout_200"
    WORKOUT_300 = "workout_300"
    WORKOUT_500 = "workout_500"
    # Ruta del Tesorero (nuevos)
    SAVINGS_10K = "savings_10k"
    SAVINGS_100K = "savings_100k"
    SAVINGS_500K = "savings_500k"
    SAVINGS_1M = "savings_1m"
    # Ruta del Bibliotecario (nuevos)
    READ_50H = "read_50h"
    READ_100H = "read_100h"
    READ_250H = "read_250h"
    READ_500H = "read_500h"
    BOOKS_CLASSICS_5 = "books_classics_5"
    BOOKS_PHILOSOPHY_10 = "books_philosophy_10"
    BOOKS_SCIENCE_5 = "books_science_5"
    # Ruta del Estratega (nuevos)
    TASKS_10 = "tasks_10"
    TASKS_50 = "tasks_50"
    TASKS_100 = "tasks_100"
    TASKS_ZERO_OVERDUE = "tasks_zero_overdue"


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
    BadgeCode.XP_1000: "Mil puntos",
    BadgeCode.RANK_DESPERTADO: "Despertado",
    BadgeCode.RANK_MAESTRO: "Maestro",
    BadgeCode.RANK_SANTO: "Santo",
    BadgeCode.RANK_SOBERANO: "Soberano",
    BadgeCode.RANK_ESPIRITU: "Espíritu",
    BadgeCode.RANK_DIOS: "Dios",
    BadgeCode.STUDY_10H: "Diez horas de estudio",
    BadgeCode.WORKOUT_30: "Forja de Huesos 1",
    BadgeCode.ALL_ROUNDER: "Todoterreno",
    BadgeCode.STUDY_50H: "Aprendiz",
    BadgeCode.STUDY_100H: "Forjador de Alma",
    BadgeCode.STUDY_250H: "Sabio en Ciernes",
    BadgeCode.STUDY_500H: "Erudito Consagrado",
    BadgeCode.WORKOUT_60: "Forja de Huesos 2",
    BadgeCode.WORKOUT_90: "Forja de Huesos 3",
    BadgeCode.WORKOUT_120: "Limpieza de Médula 1",
    BadgeCode.WORKOUT_150: "Limpieza de Médula 2",
    BadgeCode.WORKOUT_200: "Limpieza de Médula 3",
    BadgeCode.WORKOUT_300: "Médula Forjada",
    BadgeCode.WORKOUT_500: "Cuerpo Dorado Primordial",
    BadgeCode.SAVINGS_10K: "Monje Mendigo",
    BadgeCode.SAVINGS_100K: "Comerciante Ambulante",
    BadgeCode.SAVINGS_500K: "Tesorero de la Secta",
    BadgeCode.SAVINGS_1M: "Rico McPato",
    BadgeCode.READ_50H: "Lector Iniciante",
    BadgeCode.READ_100H: "Lector Amateur",
    BadgeCode.READ_250H: "Lector Ávido",
    BadgeCode.READ_500H: "Lector Omnisciente",
    BadgeCode.BOOKS_CLASSICS_5: "¿Ser o no ser?",
    BadgeCode.BOOKS_PHILOSOPHY_10: "El mundo de Nahuel",
    BadgeCode.BOOKS_SCIENCE_5: "Mente Científica",
    BadgeCode.TASKS_10: "Escudero Organizado",
    BadgeCode.TASKS_50: "Caballero de la Agenda",
    BadgeCode.TASKS_100: "Estratega de Guerra",
    BadgeCode.TASKS_ZERO_OVERDUE: "Orden del Fénix",
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
        BadgeCode.STUDY_50H,
        BadgeCode.STUDY_100H,
        BadgeCode.STUDY_250H,
        BadgeCode.STUDY_500H,
        BadgeCode.ALL_ROUNDER,
    ],
    ActionType.LOG_WORKOUT: [
        BadgeCode.FIRST_WORKOUT,
        BadgeCode.WORKOUT_30,
        BadgeCode.WORKOUT_60,
        BadgeCode.WORKOUT_90,
        BadgeCode.WORKOUT_120,
        BadgeCode.WORKOUT_150,
        BadgeCode.WORKOUT_200,
        BadgeCode.WORKOUT_300,
        BadgeCode.WORKOUT_500,
        BadgeCode.ALL_ROUNDER,
    ],
    ActionType.ADD_SAVINGS: [
        BadgeCode.SAVINGS_10K,
        BadgeCode.SAVINGS_100K,
        BadgeCode.SAVINGS_500K,
        BadgeCode.SAVINGS_1M,
    ],
    ActionType.WITHDRAW_SAVINGS: [
        BadgeCode.SAVINGS_10K,
        BadgeCode.SAVINGS_100K,
        BadgeCode.SAVINGS_500K,
        BadgeCode.SAVINGS_1M,
    ],
    ActionType.LOG_READING: [
        BadgeCode.READ_50H,
        BadgeCode.READ_100H,
        BadgeCode.READ_250H,
        BadgeCode.READ_500H,
    ],
    ActionType.FINISH_BOOK: [
        BadgeCode.READ_50H,
        BadgeCode.READ_100H,
        BadgeCode.READ_250H,
        BadgeCode.READ_500H,
        BadgeCode.BOOKS_CLASSICS_5,
        BadgeCode.BOOKS_PHILOSOPHY_10,
        BadgeCode.BOOKS_SCIENCE_5,
    ],
    ActionType.ADD_TASK: [
        BadgeCode.FIRST_TASK,
        BadgeCode.ALL_ROUNDER,
    ],
    ActionType.SET_REMINDER: [],
    ActionType.QUERY_DATA: [],
    ActionType.UNKNOWN: [],
}

# Badges que dependen de XP/nivel (se agregan si xp_result indica progreso)
LEVEL_XP_BADGES: list[BadgeCode] = [
    BadgeCode.XP_1000,
    BadgeCode.RANK_DESPERTADO,
    BadgeCode.RANK_MAESTRO,
    BadgeCode.RANK_SANTO,
    BadgeCode.RANK_SOBERANO,
    BadgeCode.RANK_ESPIRITU,
    BadgeCode.RANK_DIOS,
]

# Chequeados en cada acción del bot (las tareas se completan desde la webapp,
# así que el unlock llega en la siguiente acción o en el job de las 22:00)
CROSS_DOMAIN_BADGES: list[BadgeCode] = [
    BadgeCode.TASKS_10,
    BadgeCode.TASKS_50,
    BadgeCode.TASKS_100,
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

    # Agregar badges cross-domain (se chequean en toda acción)
    badges_to_check.extend(CROSS_DOMAIN_BADGES)

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
                {"code": badge_code.value, "user_id": get_user_id()}
            ).execute()
            newly_awarded.append({
                "code": badge_code.value,
                "name": BADGE_NAMES[badge_code],
            })

    return newly_awarded


# --- Thresholds (umbrales) para badges acumulativos ---
WORKOUT_THRESHOLDS: dict[BadgeCode, int] = {
    BadgeCode.WORKOUT_30: 30, BadgeCode.WORKOUT_60: 60, BadgeCode.WORKOUT_90: 90,
    BadgeCode.WORKOUT_120: 120, BadgeCode.WORKOUT_150: 150, BadgeCode.WORKOUT_200: 200,
    BadgeCode.WORKOUT_300: 300, BadgeCode.WORKOUT_500: 500,
}
STUDY_THRESHOLDS: dict[BadgeCode, int] = {
    BadgeCode.STUDY_10H: 600, BadgeCode.STUDY_50H: 3000, BadgeCode.STUDY_100H: 6000,
    BadgeCode.STUDY_250H: 15000, BadgeCode.STUDY_500H: 30000,
}
READ_THRESHOLDS: dict[BadgeCode, int] = {
    BadgeCode.READ_50H: 3000, BadgeCode.READ_100H: 6000,
    BadgeCode.READ_250H: 15000, BadgeCode.READ_500H: 30000,
}
SAVINGS_THRESHOLDS: dict[BadgeCode, int] = {
    BadgeCode.SAVINGS_10K: 10_000, BadgeCode.SAVINGS_100K: 100_000,
    BadgeCode.SAVINGS_500K: 500_000, BadgeCode.SAVINGS_1M: 1_000_000,
}
TASKS_THRESHOLDS: dict[BadgeCode, int] = {
    BadgeCode.TASKS_10: 10, BadgeCode.TASKS_50: 50, BadgeCode.TASKS_100: 100,
}
BOOK_CATEGORY_BADGES: dict[BadgeCode, tuple[str, int]] = {
    BadgeCode.BOOKS_CLASSICS_5: ("clasico", 5),
    BadgeCode.BOOKS_PHILOSOPHY_10: ("filosofia", 10),
    BadgeCode.BOOKS_SCIENCE_5: ("ciencia", 5),
}


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

    # --- XP ---
    if badge_code == BadgeCode.XP_1000:
        return xp_result is not None and xp_result.get("total_xp", 0) >= 1000

    # --- Rangos ---
    if badge_code == BadgeCode.RANK_DESPERTADO:
        return xp_result is not None and xp_result.get("current_level", 0) >= 5

    if badge_code == BadgeCode.RANK_MAESTRO:
        return xp_result is not None and xp_result.get("current_level", 0) >= 15

    if badge_code == BadgeCode.RANK_SANTO:
        return xp_result is not None and xp_result.get("current_level", 0) >= 30

    if badge_code == BadgeCode.RANK_SOBERANO:
        return xp_result is not None and xp_result.get("current_level", 0) >= 50

    if badge_code == BadgeCode.RANK_ESPIRITU:
        return xp_result is not None and xp_result.get("current_level", 0) >= 75

    if badge_code == BadgeCode.RANK_DIOS:
        return xp_result is not None and xp_result.get("current_level", 0) >= 100

    # --- Dominio-especificos (threshold-based) ---
    if badge_code in WORKOUT_THRESHOLDS:
        result = supabase.table("workouts").select("id", count="exact").execute()
        return (result.count or 0) >= WORKOUT_THRESHOLDS[badge_code]

    if badge_code in STUDY_THRESHOLDS:
        result = (
            supabase.table("study_sessions")
            .select("duration_minutes")
            .not_.is_("duration_minutes", "null")
            .execute()
        )
        total = sum(row.get("duration_minutes") or 0 for row in result.data)
        return total >= STUDY_THRESHOLDS[badge_code]

    if badge_code in READ_THRESHOLDS:
        result = supabase.table("reading_sessions").select("duration_minutes").execute()
        total = sum(row.get("duration_minutes") or 0 for row in result.data)
        return total >= READ_THRESHOLDS[badge_code]

    if badge_code in SAVINGS_THRESHOLDS:
        result = supabase.table("savings_transactions").select("amount, type").execute()
        balance = sum(
            r["amount"] if r["type"] == "deposit" else -r["amount"]
            for r in result.data
        )
        return balance >= SAVINGS_THRESHOLDS[badge_code]

    if badge_code in TASKS_THRESHOLDS:
        result = (
            supabase.table("tasks").select("id", count="exact")
            .eq("status", "done").execute()
        )
        return (result.count or 0) >= TASKS_THRESHOLDS[badge_code]

    if badge_code in BOOK_CATEGORY_BADGES:
        category, needed = BOOK_CATEGORY_BADGES[badge_code]
        result = (
            supabase.table("books").select("id", count="exact")
            .eq("status", "terminado").eq("category", category).execute()
        )
        return (result.count or 0) >= needed

    if badge_code == BadgeCode.TASKS_ZERO_OVERDUE:
        return False  # solo lo otorga el job del scheduler (check_zero_overdue_badge)

    if badge_code == BadgeCode.ALL_ROUNDER:
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


async def check_zero_overdue_badge() -> dict | None:
    """Job 22:00: otorga TASKS_ZERO_OVERDUE si no hay tareas vencidas.

    Condición: 0 tareas activas (todo/doing, is_deleted=False) con due_date < hoy,
    Y al menos 1 tarea con due_date registrada históricamente (evita unlock trivial).
    Devuelve el dict del badge otorgado o None.
    """
    supabase = get_supabase()
    existing = (
        supabase.table("badges").select("code")
        .eq("code", BadgeCode.TASKS_ZERO_OVERDUE.value).execute()
    )
    if existing.data:
        return None
    with_due = (
        supabase.table("tasks").select("id", count="exact")
        .not_.is_("due_date", "null").execute()
    )
    if (with_due.count or 0) == 0:
        return None
    today_iso = date.today().isoformat()
    overdue = (
        supabase.table("tasks").select("id", count="exact")
        .eq("is_deleted", False).in_("status", ["todo", "doing"])
        .lt("due_date", today_iso).execute()
    )
    if (overdue.count or 0) > 0:
        return None
    supabase.table("badges").insert({
        "code": BadgeCode.TASKS_ZERO_OVERDUE.value,
        "user_id": get_user_id(),
    }).execute()
    return {
        "code": BadgeCode.TASKS_ZERO_OVERDUE.value,
        "name": BADGE_NAMES[BadgeCode.TASKS_ZERO_OVERDUE],
    }
