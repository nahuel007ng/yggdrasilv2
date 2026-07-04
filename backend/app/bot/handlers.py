import logging

from telegram import Update
from telegram.ext import ContextTypes

from app.llm.parser import parse_message
from app.models.schemas import ParseError
from app.services.action_router import execute_action

logger = logging.getLogger(__name__)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para mensajes de texto libres. Parsea con LLM y ejecuta acción."""
    text = update.message.text
    user_id = update.effective_user.id
    logger.info("Mensaje recibido de %s: %s", user_id, text)

    # Indicar que estamos procesando
    await update.message.reply_chat_action("typing")

    # Parsear con LLM
    result = await parse_message(text)

    if isinstance(result, ParseError):
        await update.message.reply_text(
            f"No pude procesar tu mensaje. {result.error}\n"
            "Intentá reformularlo."
        )
        return

    # Ejecutar acción
    response = await execute_action(result)
    await update.message.reply_text(response)
