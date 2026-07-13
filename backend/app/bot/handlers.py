import logging

from app.llm.parser import parse_message
from app.models.schemas import ParseError
from app.services.action_router import execute_action

logger = logging.getLogger(__name__)


async def parse_and_execute(text: str, user_id: str | None = None) -> str:
    """Procesa un mensaje de texto y devuelve la respuesta.

    Agnostico del canal — funciona para Telegram, WhatsApp, HTTP, etc.

    Args:
        text: Texto del mensaje del usuario
        user_id: ID del usuario (opcional, para contexto)

    Returns:
        Texto de respuesta para enviar al usuario
    """
    result = await parse_message(text)

    if isinstance(result, ParseError):
        return f"No pude procesar tu mensaje. {result.error}\nIntentá reformularlo."

    response = await execute_action(result)
    return response["reply"]
