import logging
from typing import Callable, Awaitable

import telegram
from telegram.ext import Application, CommandHandler, MessageHandler, filters

from app.db.supabase import get_supabase

logger = logging.getLogger(__name__)

MessageHandlerCallback = Callable[[str, str, str], Awaitable[str]]


class TelegramProvider:
    """Provider de mensajeria para Telegram usando python-telegram-bot."""

    channel = "telegram"

    def __init__(
        self,
        token: str,
        message_handler_callback: MessageHandlerCallback | None = None,
    ):
        """
        Args:
            token: Bot token de Telegram (de BotFather)
            message_handler_callback: async fn(sender_id, text, channel) -> str
        """
        self.token = token
        self._message_handler_callback = message_handler_callback
        self._app: Application | None = None

    async def start(self) -> None:
        """Inicia el bot de Telegram con polling."""
        from app.bot.commands import start_command, help_command

        self._app = Application.builder().token(self.token).build()
        self._app.add_handler(CommandHandler("start", start_command))
        self._app.add_handler(CommandHandler("help", help_command))

        async def _handle(update, context):
            await update.message.reply_chat_action("typing")
            chat_id = update.effective_chat.id

            # Guardar chat_id para notificaciones
            try:
                await self._save_chat_id(chat_id)
            except Exception:
                logger.exception("Error al guardar chat_id")

            if self._message_handler_callback:
                response = await self._message_handler_callback(
                    str(chat_id),
                    update.message.text,
                    "telegram",
                )
                await update.message.reply_text(response)

        self._app.add_handler(
            MessageHandler(filters.TEXT & ~filters.COMMAND, _handle)
        )

        await self._app.initialize()
        await self._app.start()
        await self._app.updater.start_polling()
        logger.info("TelegramProvider iniciado en modo polling")

    async def stop(self) -> None:
        """Detiene el bot de Telegram."""
        if self._app:
            await self._app.updater.stop()
            await self._app.stop()
            await self._app.shutdown()
            logger.info("TelegramProvider detenido")

    async def send_message(self, recipient_id: str, text: str) -> None:
        """Envia mensaje via Telegram Bot API."""
        bot = telegram.Bot(token=self.token)
        async with bot:
            await bot.send_message(chat_id=int(recipient_id), text=text)

    async def _save_chat_id(self, chat_id: int) -> None:
        """Guarda el chat_id del usuario en user_profile."""
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
