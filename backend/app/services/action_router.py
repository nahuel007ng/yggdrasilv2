from app.models.schemas import ActionType
from app.services.expenses import add_expense
from app.services.habits import toggle_habit
from app.services.tasks import add_task
from app.services.study import log_study
from app.services.workouts import log_workout
from app.services.reminders import set_reminder
from app.services.queries import query_data


async def execute_action(parsed) -> str:
    """Ejecuta la acción parseada y devuelve un mensaje de respuesta para el usuario."""
    try:
        if parsed.action == ActionType.ADD_EXPENSE:
            result = await add_expense(parsed.payload)
            if result["success"]:
                amount_str = f"${result['amount']:,.0f}" if result["amount"] else "monto no especificado"
                return f"Gasto registrado: {amount_str} en {result['category']}."
            return f"Error al registrar gasto: {result.get('error', 'desconocido')}"

        elif parsed.action == ActionType.TOGGLE_HABIT:
            result = await toggle_habit(parsed.payload)
            if result["success"]:
                return f"Hábito completado: {result['habit_name']} ({result['date']})."
            return f"Error con hábito: {result.get('error', 'desconocido')}"

        elif parsed.action == ActionType.ADD_TASK:
            result = await add_task(parsed.payload)
            if result["success"]:
                due = f" (deadline: {result['due_date']})" if result['due_date'] else ""
                return f"Tarea creada: {result['title']}{due}."
            return f"Error al crear tarea: {result.get('error', 'desconocido')}"

        elif parsed.action == ActionType.LOG_STUDY:
            result = await log_study(parsed.payload)
            if result["success"]:
                dur = f" ({result['duration_minutes']} min)" if result.get("duration_minutes") else ""
                return f"Sesión de estudio registrada: {result['subject']}{dur}."
            return f"Error al registrar estudio: {result.get('error', 'desconocido')}"

        elif parsed.action == ActionType.LOG_WORKOUT:
            result = await log_workout(parsed.payload)
            if result["success"]:
                return f"Entrenamiento registrado: {result['exercise_count']} ejercicios ({result['date']})."
            return f"Error al registrar entrenamiento: {result.get('error', 'desconocido')}"

        elif parsed.action == ActionType.SET_REMINDER:
            result = await set_reminder(parsed.payload)
            if result["success"]:
                time_str = f" a las {result['time']}" if result.get("time") else ""
                recurring_str = " (recurrente)" if result.get("recurring") else ""
                return f"Recordatorio creado: {result['description']} para el {result['reminder_date']}{time_str}{recurring_str}."
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

