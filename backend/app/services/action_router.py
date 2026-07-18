import logging

from app.models.schemas import ActionType
from app.bot import replies

logger = logging.getLogger(__name__)
from app.llm.composer import compose_reply
from app.services.analytics import get_metric
from app.services.recommendations import get_recommendation
from app.services.expenses import add_expense, add_expected_transaction, confirm_transaction
from app.services.savings import add_savings, withdraw_savings
from app.services.reading import finish_book, log_reading
from app.services.habits import toggle_habit
from app.services.tasks import add_task
from app.services.study import log_study
from app.services.workouts import log_workout
from app.services.reminders import set_reminder, delete_reminder
from app.services.queries import query_data
from app.services.gamification import award_xp, get_user_stats
from app.services.badges import check_and_award_badges
from app.services.titles import check_and_award_titles
from app.services.daily_quests import update_quest_progress


def _format_xp_feedback(xp_result: dict) -> str:
    """Formatea el feedback de XP para la respuesta del bot."""
    if xp_result["xp_awarded"] == 0:
        return ""

    parts = [f"+{xp_result['xp_awarded']} XP"]
    parts.append(f"(nivel {xp_result['current_level']}, {xp_result['xp_progress']} XP)")

    feedback = " ".join(parts)

    if xp_result["leveled_up"]:
        feedback += f"\n🎉 ¡Has ascendido al nivel {xp_result['new_level']}, Gran Maestro!"

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
        lines.append(f"¡Has despertado el logro «{badge['name']}», Gran Maestro!")

    return "\n" + "\n".join(lines)


def _format_title_feedback(titles: list[dict]) -> str:
    """Formatea feedback de títulos desbloqueados."""
    if not titles:
        return ""
    parts = [f"\n🏆 ¡Nuevo título: {t['name']}, Gran Maestro!" for t in titles]
    return "".join(parts)


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
    level_up_lines: list[str] = []
    for completed_quest in quest_result:
        xp_result = await award_xp("QUEST_BONUS", amount_override=completed_quest["xp_reward"])
        if xp_result.get("leveled_up"):
            level_up_lines.append(f"🎉 ¡Has ascendido al nivel {xp_result['new_level']}, Gran Maestro!")
    feedback = _format_quest_feedback(quest_result)
    if level_up_lines:
        feedback += "\n" + "\n".join(level_up_lines)
    # Gamificación V2.2: chequear títulos al final del pipeline
    new_titles = await check_and_award_titles()
    feedback += _format_title_feedback(new_titles)
    return feedback


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
                msg = f"{replies.prefix()} Gasto registrado: {amount_str} en {result['category']}."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al registrar gasto: {result.get('error', 'desconocido')}, Gran Maestro.")

        elif parsed.action == ActionType.ADD_EXPECTED:
            result = await add_expected_transaction(parsed.payload)
            if result["success"]:
                tipo = "Ingreso" if result["type"] == "income" else "Gasto"
                msg = f"{replies.prefix()} 📋 {tipo} esperado registrado: ${result['amount']:,.0f}"
                if result.get("description"):
                    msg += f" — {result['description']}"
                msg += f"\n📅 Fecha esperada: {result['expected_date']}"
                msg += "\nEl Sistema te avisará cuando llegue la fecha."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al registrar transacción esperada: {result.get('error', 'desconocido')}, Gran Maestro.")

        elif parsed.action == ActionType.CONFIRM_TRANSACTION:
            result = await confirm_transaction(parsed.payload)
            if result["success"]:
                if result["confirmed"]:
                    msg = f"{replies.prefix()} ✅ Transacción confirmada: ${result['amount']:,.0f}"
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
                    return await _build_response("❌ Transacción cancelada, Gran Maestro.")
            return await _build_response(f"Error al confirmar transacción: {result.get('error', 'desconocido')}, Gran Maestro.")

        elif parsed.action == ActionType.TOGGLE_HABIT:
            result = await toggle_habit(parsed.payload)
            if result["success"]:
                msg = f"{replies.prefix()} Hábito completado: {result['habit_name']} ({result['date']})."
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
            return await _build_response(f"Error con hábito: {result.get('error', 'desconocido')}, Gran Maestro.")

        elif parsed.action == ActionType.ADD_TASK:
            result = await add_task(parsed.payload)
            if result["success"]:
                due = f" (deadline: {result['due_date']})" if result['due_date'] else ""
                msg = f"{replies.prefix()} Misión registrada: {result['title']}{due}."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al crear tarea: {result.get('error', 'desconocido')}, Gran Maestro.")

        elif parsed.action == ActionType.LOG_STUDY:
            result = await log_study(parsed.payload)
            if result["success"]:
                if result.get("duration_minutes"):
                    msg = f"{replies.prefix()} Has forjado {result['duration_minutes']} min de estudio de {result['subject']}."
                else:
                    msg = f"{replies.prefix()} Sesión de estudio registrada: {result['subject']}."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al registrar estudio: {result.get('error', 'desconocido')}, Gran Maestro.")

        elif parsed.action == ActionType.LOG_WORKOUT:
            result = await log_workout(parsed.payload)
            if result["success"]:
                msg = f"{replies.prefix()} Entrenamiento registrado: {result['exercise_count']} ejercicios ({result['date']})."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al registrar entrenamiento: {result.get('error', 'desconocido')}, Gran Maestro.")

        elif parsed.action == ActionType.SET_REMINDER:
            result = await set_reminder(parsed.payload)
            if result["success"]:
                time_str = f" a las {result['time']}" if result.get("time") else ""
                recurring_str = " (recurrente)" if result.get("recurring") else ""
                anticipation_str = ""
                if result.get("remind_before_minutes", 0) > 0:
                    anticipation_str = f" (anticipación: {result['remind_before_minutes']} min)"
                msg = f"{replies.prefix()} Recordatorio creado: {result['description']} para el {result['reminder_date']}{time_str}{recurring_str}{anticipation_str}."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al crear recordatorio: {result.get('error', 'desconocido')}, Gran Maestro.")

        elif parsed.action == ActionType.DELETE_REMINDER:
            result = await delete_reminder(parsed.payload)
            if result["success"]:
                recurring_note = " (se canceló la recurrencia)" if result.get("was_recurring") else ""
                msg = f"Recordatorio eliminado: {result['description']} ({result['reminder_date']}){recurring_note}, Gran Maestro."
                return await _build_response(msg)
            elif result.get("error") == "ambiguous":
                matches_str = "\n".join(result["matches"])
                msg = f"Gran Maestro, encontré varios recordatorios que coinciden con \"{result['description']}\":\n{matches_str}\n\nSé más específico para que el Sistema elimine el correcto."
                return await _build_response(msg)
            else:
                msg = f"No encontré ningún recordatorio activo que coincida con \"{result['description']}\", Gran Maestro."
                return await _build_response(msg)

        elif parsed.action == ActionType.QUERY_DATA:
            result = await query_data(parsed.payload)
            if result["success"]:
                return await _build_response(f"Gran Maestro, aquí está tu reporte:\n\n{result['summary']}")
            return await _build_response(f"Error al consultar datos: {result.get('error', 'desconocido')}, Gran Maestro.")

        elif parsed.action == ActionType.ADD_SAVINGS:
            result = await add_savings(parsed.payload)
            if result["success"]:
                amount_str = f"${result['amount']:,.0f}" if result["amount"] else "monto no especificado"
                msg = f"{replies.prefix()} 💰 Has añadido {amount_str} a la reserva"
                if result.get("description"):
                    msg += f" — {result['description']}"
                msg += ". El tesoro del clan crece."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(
                    action_type=parsed.action,
                    xp_result=xp_result,
                )
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al registrar ahorro: {result.get('error', 'desconocido')}, Gran Maestro.")

        elif parsed.action == ActionType.WITHDRAW_SAVINGS:
            result = await withdraw_savings(parsed.payload)
            if result["success"]:
                amount_str = f"${result['amount']:,.0f}" if result["amount"] else "monto no especificado"
                msg = f"💸 Retiro de la reserva: {amount_str}"
                if result.get("description"):
                    msg += f" — {result['description']}"
                msg += ", Gran Maestro."
                return await _build_response(msg)
            return await _build_response(f"Error al retirar de ahorros: {result.get('error', 'desconocido')}, Gran Maestro.")

        elif parsed.action == ActionType.LOG_READING:
            result = await log_reading(parsed.payload)
            if result["success"]:
                book_part = f" de «{result['book_title']}»" if result.get("book_title") else ""
                msg = f"{replies.prefix()} 📖 {result['duration_minutes']} min de lectura absorbidos de los pergaminos{book_part}."
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(action_type=parsed.action, xp_result=xp_result)
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al registrar la lectura: {result.get('error', 'desconocido')}, Gran Maestro.")

        elif parsed.action == ActionType.FINISH_BOOK:
            result = await finish_book(parsed.payload)
            if result["success"]:
                msg = f"{replies.prefix()} 📚 ¡Pergamino completado: «{result['title']}»! ({result['category']})"
                xp_result = await award_xp(parsed.action)
                msg += _format_xp_feedback(xp_result)
                badges = await check_and_award_badges(action_type=parsed.action, xp_result=xp_result)
                msg += _format_badge_feedback(badges)
                msg += await _track_quests_and_award_bonus(parsed.action.value)
                return await _build_response(msg, xp_result, badges)
            return await _build_response(f"Error al registrar el libro: {result.get('error', 'desconocido')}, Gran Maestro.")

        elif parsed.action == ActionType.QUERY_ANALYTICS:
            result = await get_metric(parsed.payload)
            if result["success"]:
                reply = await compose_reply(
                    parsed.payload.original_question or "",
                    result["metric"],
                    result["data"],
                )
                return await _build_response(reply)
            return await _build_response(result["error"])

        elif parsed.action == ActionType.GET_RECOMMENDATION:
            result = await get_recommendation(parsed.payload)
            if result["success"]:
                return await _build_response(result["reply"])
            return await _build_response(result["error"])

        elif parsed.action == ActionType.UNKNOWN:
            return await _build_response(
                "Comando no reconocido, Gran Maestro. Podés decirme cosas como:\n"
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
            return await _build_response(f"Acción '{parsed.action}' no está implementada todavía, Gran Maestro.")

    except Exception:
        logger.exception("Error ejecutando acción %s", parsed.action if parsed else "UNKNOWN")
        return await _build_response(replies.ERROR_GENERIC)
