from app.models.schemas import ActionType
from app.services.expenses import add_expense
from app.services.habits import toggle_habit
from app.services.tasks import add_task


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
                due = f" (deadline: {result['due_date']})" if result["due_date"] else ""
                return f"Tarea creada: {result['title']}{due}."
            return f"Error al crear tarea: {result.get('error', 'desconocido')}"

        elif parsed.action == ActionType.UNKNOWN:
            return "No entendí qué querés hacer. Probá con algo como 'gasté 200 en comida' o 'hice ejercicio'."

        else:
            return f"Acción '{parsed.action}' no está implementada todavía."

    except Exception as e:
        return f"Error al ejecutar la acción: {e!s}"
