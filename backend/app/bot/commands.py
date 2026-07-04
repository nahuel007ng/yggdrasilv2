from telegram import Update
from telegram.ext import ContextTypes


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para /start."""
    await update.message.reply_text(
        "¡Hola! Soy Yggdrasil, tu asistente de organización personal.\n\n"
        "Podés decirme cosas como:\n"
        "• 'gasté 350 en comida'\n"
        "• 'hice ejercicio'\n"
        "• 'tengo que estudiar análisis'\n\n"
        "Escribí /help para ver todos los comandos."
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para /help."""
    await update.message.reply_text(
        "Comandos disponibles:\n"
        "/start - Iniciar el bot\n"
        "/help - Ver esta ayuda\n\n"
        "O simplemente escribime en lenguaje natural lo que quieras registrar."
    )
