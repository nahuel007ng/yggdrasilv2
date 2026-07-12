import logging
import random
from datetime import date, datetime

from app.db.supabase import get_supabase, get_user_id

logger = logging.getLogger(__name__)

QUEST_TEMPLATES = [
    {
        "key": "expense_1",
        "description": "Registrá al menos 1 gasto",
        "action_type": "ADD_EXPENSE",
        "target": 1,
        "xp_reward": 25,
    },
    {
        "key": "expense_3",
        "description": "Registrá 3 gastos",
        "action_type": "ADD_EXPENSE",
        "target": 3,
        "xp_reward": 40,
    },
    {
        "key": "habit_all",
        "description": "Completá todos tus hábitos de hoy",
        "action_type": "TOGGLE_HABIT",
        "target": -1,  # -1 = dinámico (cuenta de hábitos activos)
        "xp_reward": 50,
    },
    {
        "key": "study_1",
        "description": "Registrá una sesión de estudio",
        "action_type": "LOG_STUDY",
        "target": 1,
        "xp_reward": 30,
    },
    {
        "key": "workout_1",
        "description": "Hacé un entrenamiento",
        "action_type": "LOG_WORKOUT",
        "target": 1,
        "xp_reward": 30,
    },
    {
        "key": "task_2",
        "description": "Creá 2 tareas nuevas",
        "action_type": "ADD_TASK",
        "target": 2,
        "xp_reward": 25,
    },
    {
        "key": "any_5",
        "description": "Registrá 5 acciones de cualquier tipo",
        "action_type": "ANY",
        "target": 5,
        "xp_reward": 35,
    },
    {
        "key": "reminder_1",
        "description": "Creá un recordatorio",
        "action_type": "SET_REMINDER",
        "target": 1,
        "xp_reward": 20,
    },
]


async def generate_daily_quests(user_id: str | None = None, target_date: date | None = None) -> None:
    """Genera 3 misiones aleatorias para el día. Idempotente: no genera si ya existen."""
    supabase = get_supabase()
    if user_id is None:
        user_id = get_user_id()
    if target_date is None:
        target_date = date.today()

    # Chequear si ya existen quests para hoy
    existing = (
        supabase.table("daily_quests")
        .select("id")
        .eq("user_id", user_id)
        .eq("date", target_date.isoformat())
        .execute()
    )

    if existing.data and len(existing.data) > 0:
        return  # Ya generadas, no duplicar

    # Seleccionar 3 templates aleatorios (sin repetición)
    selected = random.sample(QUEST_TEMPLATES, min(3, len(QUEST_TEMPLATES)))

    for template in selected:
        target = template["target"]

        # Si es 'habit_all', resolver el target dinámico
        if target == -1:
            habits = (
                supabase.table("habits")
                .select("id")
                .eq("user_id", user_id)
                .eq("is_archived", False)
                .execute()
            )
            target = len(habits.data) if habits.data else 3  # fallback 3

        supabase.table("daily_quests").insert({
            "user_id": user_id,
            "date": target_date.isoformat(),
            "quest_type": template["key"],
            "description": template["description"],
            "target_count": target,
            "current_count": 0,
            "is_completed": False,
            "xp_reward": template["xp_reward"],
        }).execute()

    logger.info("Generadas 3 daily quests para user %s fecha %s", user_id, target_date)


async def update_quest_progress(action_type: str) -> list[dict]:
    """Actualiza el progreso de quests relevantes. Retorna lista de quests completadas."""
    supabase = get_supabase()
    user_id = get_user_id()
    today = date.today()
    completed_quests: list[dict] = []

    # Obtener quests de hoy no completadas
    quests = (
        supabase.table("daily_quests")
        .select("*")
        .eq("user_id", user_id)
        .eq("date", today.isoformat())
        .eq("is_completed", False)
        .execute()
    )

    if not quests.data:
        # Lazy generation: si no hay quests para hoy, generarlas
        await generate_daily_quests(user_id, today)
        quests = (
            supabase.table("daily_quests")
            .select("*")
            .eq("user_id", user_id)
            .eq("date", today.isoformat())
            .eq("is_completed", False)
            .execute()
        )
        if not quests.data:
            return completed_quests

    for quest in quests.data:
        # Buscar el action_type del template
        quest_action = next(
            (t["action_type"] for t in QUEST_TEMPLATES if t["key"] == quest["quest_type"]),
            None,
        )

        if quest_action is None:
            continue

        if quest_action != "ANY" and quest_action != action_type:
            continue

        # Incrementar progreso
        new_count = quest["current_count"] + 1
        update_data: dict = {"current_count": new_count}

        # Chequear si se completó
        if new_count >= quest["target_count"]:
            update_data["is_completed"] = True
            update_data["completed_at"] = datetime.utcnow().isoformat()
            completed_quests.append({
                "description": quest["description"],
                "xp_reward": quest["xp_reward"],
            })

        supabase.table("daily_quests").update(update_data).eq("id", quest["id"]).execute()

    return completed_quests


async def get_today_quests(user_id: str | None = None) -> list[dict]:
    """Retorna las quests de hoy. Si no existen, las genera (lazy fallback)."""
    supabase = get_supabase()
    if user_id is None:
        user_id = get_user_id()
    today = date.today()

    quests = (
        supabase.table("daily_quests")
        .select("*")
        .eq("user_id", user_id)
        .eq("date", today.isoformat())
        .execute()
    )

    if not quests.data or len(quests.data) == 0:
        await generate_daily_quests(user_id, today)
        quests = (
            supabase.table("daily_quests")
            .select("*")
            .eq("user_id", user_id)
            .eq("date", today.isoformat())
            .execute()
        )

    return quests.data or []
