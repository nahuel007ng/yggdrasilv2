import logging

from telegram import Update
from telegram.ext import ContextTypes

from app.db.supabase import get_supabase
from app.llm.parser import parse_message
from app.models.schemas import ParseError
from app.services.action_router import execute_action

logger = logging.getLogger(__name__)


async def _save_chat_id(chat_id: int) -> None:
    """Guarda el chat_id en user_profile si no esta guardado."""
    supabase = get_supabase()
    result = (
        supabase.table("user_profile")
        .select("id, telegram_chat_id")
        .limit(1)
        .execute()
    )
    if result.data:
        profile = result.data[0]
        if profile.get("telegram_chat_id") != chat_id:
            supabase.table("user_profile").update(
                {"telegram_chat_id": chat_id}
            ).eq("id", profile["id"]).execute()
            logger.info("Chat ID %s guardado en user_profile", chat_id)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para mensajes de texto libres. Parsea con LLM y ejecuta acción."""
    text = update.message.text
    user_id = update.effective_user.id
    chat_id = update.effective_chat.id
    logger.info("Mensaje recibido de %s: %s", user_id, text)

    # Guardar chat_id para notificaciones proactivas (no debe bloquear el handler)
    try:
        await _save_chat_id(chat_id)
    except Exception:
        logger.exception("Error al guardar chat_id")

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
    await update.message.reply_text(response["reply"])
