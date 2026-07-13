from app.models.schemas import ActionType
from app.services.expenses import add_expense, add_expected_transaction, confirm_transaction
from app.services.savings import add_savings, withdraw_savings
from app.services.habits import toggle_habit
from app.services.tasks import add_task
from app.services.study import log_study
from app.services.workouts import log_workout
from app.services.reminders import set_reminder, delete_reminder
from app.services.queries import query_data
from app.services.gamification import award_xp, get_user_stats
from app.services.badges import check_and_award_badges
from app.services.daily_quests import update_quest_progress


def _format_xp_feedback(xp_result: dict) -> str:
    """Formatea el feedback de XP para la respuesta del bot."""
    if xp_result["xp_awarded"] == 0:
        return ""

    parts = [f"+{xp_result['xp_awarded']} XP"]
    parts.append(f"(nivel {xp_result['current_level']}, {xp_result['xp_progress']} XP)")

    feedback = " ".join(parts)

    if xp_result["leveled_up"]:
        feedback += f"\n🎉 ¡Subiste al nivel {xp_result['new_level']}!"

    return f"\n{feedback}"


def _format_streak_feedback(habit_result: dict) -> str:
    """Formatea feedback de racha para la respuesta del bot."""
    streak_data = habit_result.get("streak")
    week_data = habit_result.get("perfect_week")

    if not streak_data:
        return ""

    parts = []

    # Racha actual
    current = streak_data.get("current_streak", 0)
    if current > 0:
        parts.append(f"Racha: {current} dia{'s' if current != 1 else ''}")

    # Shield consumido
    if streak_data.get("shield_consumed"):
        remaining = streak_data.get("shields_remaining", 0)
        parts.append(f"(shield usado, te quedan {remaining})")

    # Shield ganado por semana perfecta
    if week_data and week_data.get("shield_awarded"):
        total = week_data.get("shields_total", 0)
        parts.append(f"Semana perfecta! +1 shield ({total} total)")

    if not parts:
        return ""

    return "\n" + " | ".join(parts)


def _format_badge_feedback(badges_awarded: list[dict]) -> str:
    """Formatea feedback de badges desbloqueados para la respuesta del bot."""
    if not badges_awarded:
        return ""

    lines = []
    for badge in badges_awarded:
        lines.append(f"Badge desbloqueado: {badge['name']}!")

    return "\n" + "\n".join(lines)


def _format_quest_feedback(quest_result: list[dict]) -> str:
    """Formatea feedback de misiones diarias completadas."""
    if not quest_result:
        return ""
    lines = []
    for quest in quest_result:
        lines.append(f"✅ Misión completada: {quest['description']} (+{quest['xp_reward']} XP bonus)")
    return "\n" + "\n".join(lines)


async def _track_quests_and_award_bonus(action_type_value: str) -> str:
    """Trackea progreso de quests y otorga XP bonus por quests completadas."""
    quest_result = await update_quest_progress(action_type_value)
    # Otorgar XP bonus por cada quest completada
    for completed_quest in quest_result:
        await award_xp("QUEST_BONUS", amount_override=completed_quest["xp_reward"])
    return _format_quest_feedback(quest_result)


async def _build_response(
    reply: str,
    xp_result: dict | None = None,
    badges_awarded: list[dict] | None = None,
) -> dict:
    """Construye la respuesta estructurada para el bot y el API de chat."""
    if xp_result is None:
        stats = await get_user_stats()
        xp_result = {
            "xp_awarded": 0,
            "current_level": stats["current_level"],
        }

    badges_earned = [badge["name"] for badge in badges_awarded] if badges_awarded else []

    return {
        "reply": reply,
        "xp_gained": xp_result.get("xp_awarded", 0),
        "level": xp_result.get("current_level", 0),
        "badges_earned": badges_earned,
    }


async def execute_action(parsed, user_id: str | None = None) -> dict:
    """Ejecuta la acción parseada y devuelve un mensaje de respuesta estructurado.

    Args:
        parsed: Resultado del parser (ParsedAction o ParseError).
        user_id: UUID del usuario (opcional). En el sistema actual se asume un
            único usuario por instancia, por lo que el parámetro se recibe para
            validación futura pero la ejecución utiliza get_user_id().
    """
    try:
        if parsed.action == ActionType.ADD_EXPENSE:
            result = await add_expense(parsed.payload)
            if result["success"]:
                amount_str = f"${result['amount']:,.0f}" if result["amount"] else "monto no especificado"
                msg = f"Gasto registrado: {amount_str} en {result['category']}."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al registrar gasto: {result.get('error', 'desconocido')}")

        elif parsed.action == ActionType.ADD_EXPECTED:
            result = await add_expected_transaction(parsed.payload)
            if result["success"]:
                tipo = "Ingreso" if result["type"] == "income" else "Gasto"
                msg = f"📋 {tipo} esperado registrado: ${result['amount']:,.0f}"
                if result.get("description"):
                    msg += f" — {result['description']}"
                msg += f"\n📅 Fecha esperada: {result['expected_date']}"
                msg += "\nTe voy a avisar cuando llegue la fecha."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al registrar transacción esperada: {result.get('error', 'desconocido')}")

        elif parsed.action == ActionType.CONFIRM_TRANSACTION:
            result = await confirm_transaction(parsed.payload)
            if result["success"]:
                if result["confirmed"]:
                    msg = f"✅ Transacción confirmada: ${result['amount']:,.0f}"
                    if result.get("amount_changed"):
                        msg += f" (ajustado de ${result['original_amount']:,.0f})"
                    xp_result = await award_xp(parsed.action)
                    msg += _format_xp_feedback(xp_result)
                    badges = await check_and_award_badges(
                        action_type=parsed.action,
                        xp_result=xp_result,
                    )
                    msg += _format_badge_feedback(badges)
                    msg += await _track_quests_and_award_bonus(parsed.action.value)
                    return await _build_response(msg, xp_result, badges)
                else:
                    return await _build_response("❌ Transacción cancelada.")
            return await _build_response(f"Error al confirmar transacción: {result.get('error', 'desconocido')}")

        elif parsed.action == ActionType.TOGGLE_HABIT:
            result = await toggle_habit(parsed.payload)
            if result["success"]:
                msg = f"Hábito completado: {result['habit_name']} ({result['date']})."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                msg += _format_streak_feedback(result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                    streak_result=result.get("streak"),
                    perfect_week_result=result.get("perfect_week"),
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error con hábito: {result.get('error', 'desconocido')}")

        elif parsed.action == ActionType.ADD_TASK:
            result = await add_task(parsed.payload)
            if result["success"]:
                due = f" (deadline: {result['due_date']})" if result['due_date'] else ""
                msg = f"Tarea creada: {result['title']}{due}."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al crear tarea: {result.get('error', 'desconocido')}")

        elif parsed.action == ActionType.LOG_STUDY:
            result = await log_study(parsed.payload)
            if result["success"]:
                dur = f" ({result['duration_minutes']} min)" if result.get("duration_minutes") else ""
                msg = f"Sesión de estudio registrada: {result['subject']}{dur}."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al registrar estudio: {result.get('error', 'desconocido')}")

        elif parsed.action == ActionType.LOG_WORKOUT:
            result = await log_workout(parsed.payload)
            if result["success"]:
                msg = f"Entrenamiento registrado: {result['exercise_count']} ejercicios ({result['date']})."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al registrar entrenamiento: {result.get('error', 'desconocido')}")

        elif parsed.action == ActionType.SET_REMINDER:
            result = await set_reminder(parsed.payload)
            if result["success"]:
                time_str = f" a las {result['time']}" if result.get("time") else ""
                recurring_str = " (recurrente)" if result.get("recurring") else ""
                anticipation_str = ""
                if result.get("remind_before_minutes", 0) > 0:
                    anticipation_str = f" (anticipación: {result['remind_before_minutes']} min)"
                msg = f"Recordatorio creado: {result['description']} para el {result['reminder_date']}{time_str}{recurring_str}{anticipation_str}."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al crear recordatorio: {result.get('error', 'desconocido')}")

        elif parsed.action == ActionType.DELETE_REMINDER:
            result = await delete_reminder(parsed.payload)
            if result["success"]:
                recurring_note = " (se canceló la recurrencia)" if result.get("was_recurring") else ""
                msg = f"Recordatorio eliminado: {result['description']} ({result['reminder_date']}){recurring_note}."
                return await _build_response(msg)
            elif result.get("error") == "ambiguous":
                matches_str = "\n".join(result["matches"])
                msg = f"Encontré varios recordatorios que coinciden con \"{result['description']}\":\n{matches_str}\n\nSé más específico para que pueda eliminar el correcto."
                return await _build_response(msg)
            else:
                msg = f"No encontré ningún recordatorio activo que coincida con \"{result['description']}\"."
                return await _build_response(msg)

        elif parsed.action == ActionType.QUERY_DATA:
            result = await query_data(parsed.payload)
            if result["success"]:
                return await _build_response(result["summary"])
            return await _build_response(f"Error al consultar datos: {result.get('error', 'desconocido')}")

        elif parsed.action == ActionType.ADD_SAVINGS:
            result = await add_savings(parsed.payload)
            if result["success"]:
                amount_str = f"${result['amount']:,.0f}" if result["amount"] else "monto no especificado"
                msg = f"💰 Ahorro registrado: {amount_str}"
                if result.get("description"):
                    msg += f" — {result['description']}"
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al registrar ahorro: {result.get('error', 'desconocido')}")

        elif parsed.action == ActionType.WITHDRAW_SAVINGS:
            result = await withdraw_savings(parsed.payload)
            if result["success"]:
                amount_str = f"${result['amount']:,.0f}" if result["amount"] else "monto no especificado"
                msg = f"💸 Retiro de ahorros: {amount_str}"
                if result.get("description"):
                    msg += f" — {result['description']}"
                return await _build_response(msg)
            return await _build_response(f"Error al retirar de ahorros: {result.get('error', 'desconocido')}")

        elif parsed.action == ActionType.UNKNOWN:
            return await _build_response(
                "No entendí qué querés hacer. Probá con algo como:\n"
                "- 'gasté 200 en comida'\n"
                "- 'el 10 cobro NODO 80000'\n"
                "- 'hice ejercicio'\n"
                "- 'estudié 2 horas de análisis'\n"
                "- 'hice 3x10 flexiones'\n"
                "- 'recordame pagar la luz el 21'\n"
                "- 'ahorré 5000'\n"
                "- 'cuánto gasté este mes'"
            )

        else:
            return await _build_response(f"Acción '{parsed.action}' no está implementada todavía.")

    except Exception as e:
        return await _build_response(f"Error al ejecutar la acción: {e!s}")
