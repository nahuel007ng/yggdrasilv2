from typing import Protocol


class MessagingProvider(Protocol):
    """Interfaz para providers de mensajeria (Telegram, WhatsApp, etc.)."""

    channel: str  # 'telegram' | 'whatsapp'

    async def start(self) -> None:
        """Inicializa el provider (conexion, polling, etc.)."""
        ...

    async def stop(self) -> None:
        """Cierra la conexion y libera recursos."""
        ...

    async def send_message(self, recipient_id: str, text: str) -> None:
        """Envia un mensaje de texto al destinatario.

        Args:
            recipient_id: ID del destinatario (chat_id para Telegram, JID para WhatsApp)
            text: Texto del mensaje
        """
        ...
