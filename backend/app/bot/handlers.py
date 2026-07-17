import logging

from app.config import settings
from app.llm.parser import parse_message
from app.models.schemas import ActionType, ParseError
from app.services.action_router import execute_action
from app.bot import replies

logger = logging.getLogger(__name__)

# Estado efímero mono-usuario (se pierde en restart — aceptable, ver brief)
_pending_action: dict = {}  # {"parsed": ParsedAction, "reason": str} | vacío

_YES = {"si", "sí", "dale", "confirmo", "ok", "s"}
_NO = {"no", "cancelar", "cancela", "n"}


def _check_plausibility(parsed) -> str | None:
    """Devuelve el motivo de confirmación, o None si es plausible."""
    p = parsed.payload
    if parsed.action == ActionType.LOG_STUDY and (p.duration_minutes or 0) > settings.max_study_minutes_without_confirm:
        return f"¿Seguro que estudiaste {p.duration_minutes} minutos ({p.duration_minutes / 60:.1f} hs)?"
    if parsed.action == ActionType.LOG_READING and (p.duration_minutes or 0) > settings.max_reading_minutes_without_confirm:
        return f"¿Seguro que leíste {p.duration_minutes} minutos ({p.duration_minutes / 60:.1f} hs)?"
    if parsed.action == ActionType.ADD_EXPENSE and (p.amount or 0) > settings.max_expense_without_confirm:
        return f"¿Confirmás un gasto de ${p.amount:,.0f}?"
    return None


async def parse_and_execute(text: str, user_id: str | None = None) -> str:
    """Procesa un mensaje de texto y devuelve la respuesta.

    Agnostico del canal — funciona para Telegram, WhatsApp, HTTP, etc.

    Args:
        text: Texto del mensaje del usuario
        user_id: ID del usuario (opcional, para contexto)

    Returns:
        Texto de respuesta para enviar al usuario
    """
    global _pending_action

    normalized = text.strip().lower()

    if _pending_action:
        pending = _pending_action.pop("parsed")
        if normalized in _YES:
            response = await execute_action(pending)
            return response["reply"]
        if normalized in _NO:
            return "Ok, cancelado. No registré nada."
        # ni sí ni no: se descarta el pendiente y se procesa el mensaje nuevo normalmente

    result = await parse_message(text)

    if isinstance(result, ParseError):
        return f"No pude procesar tu mensaje. {result.error}\nIntentá reformularlo."

    reason = _check_plausibility(result)
    if reason:
        _pending_action["parsed"] = result
        return f"{reason}\n{replies.PENDING_CONFIRM_HINT}"

    response = await execute_action(result)
    return response["reply"]
