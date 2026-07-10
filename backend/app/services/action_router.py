from app.models.schemas import ActionType
from app.services.expenses import add_expense, add_expected_transaction, confirm_transaction
from app.services.habits import toggle_habit
from app.services.tasks import add_task
from app.services.study import log_study
from app.services.workouts import log_workout
from app.services.reminders import set_reminder
from app.services.queries import query_data
from app.services.gamification import award_xp
from app.services.badges import check_and_award_badges


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


async def execute_action(parsed) -> str:
    """Ejecuta la acción parseada y devuelve un mensaje de respuesta para el usuario."""
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
                return msg
            return f"Error al registrar gasto: {result.get('error', 'desconocido')}"

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
                return msg
            return f"Error al registrar transacción esperada: {result.get('error', 'desconocido')}"

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
                    return msg
                else:
                    return "❌ Transacción cancelada."
            return f"Error al confirmar transacción: {result.get('error', 'desconocido')}"

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
                return msg
            return f"Error con hábito: {result.get('error', 'desconocido')}"

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
                return msg
            return f"Error al crear tarea: {result.get('error', 'desconocido')}"

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
                return msg
            return f"Error al registrar estudio: {result.get('error', 'desconocido')}"

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
                return msg
            return f"Error al registrar entrenamiento: {result.get('error', 'desconocido')}"

        elif parsed.action == ActionType.SET_REMINDER:
            result = await set_reminder(parsed.payload)
            if result["success"]:
                time_str = f" a las {result['time']}" if result.get("time") else ""
                recurring_str = " (recurrente)" if result.get("recurring") else ""
                msg = f"Recordatorio creado: {result['description']} para el {result['reminder_date']}{time_str}{recurring_str}."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                return msg
            return f"Error al crear recordatorio: {result.get('error', 'desconocido')}"

        elif parsed.action == ActionType.QUERY_DATA:
            result = await query_data(parsed.payload)
            if result["success"]:
                return result["summary"]
            return f"Error al consultar datos: {result.get('error', 'desconocido')}"

        elif parsed.action == ActionType.UNKNOWN:
            return (
                "No entendí qué querés hacer. Probá con algo como:\n"
                "- 'gasté 200 en comida'\n"
                "- 'el 10 cobro NODO 80000'\n"
                "- 'hice ejercicio'\n"
                "- 'estudié 2 horas de análisis'\n"
                "- 'hice 3x10 flexiones'\n"
                "- 'recordame pagar la luz el 21'\n"
                "- 'cuánto gasté este mes'"
            )

        else:
            return f"Acción '{parsed.action}' no está implementada todavía."

    except Exception as e:
        return f"Error al ejecutar la acción: {e!s}"
