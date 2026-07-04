from telegram.ext import Application, CommandHandler, MessageHandler, filters
from app.config import settings
from app.bot.commands import start_command, help_command
from app.bot.handlers import handle_message


def create_bot_application() -> Application:
    """Crea y configura la Application de python-telegram-bot."""
    application = Application.builder().token(settings.telegram_bot_token).build()

    # Comandos
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))

    # Mensajes de texto (catch-all)
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    return application
