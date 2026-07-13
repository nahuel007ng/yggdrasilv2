import logging
from typing import Optional

from app.messaging.provider import MessagingProvider

logger = logging.getLogger(__name__)


class ProviderRegistry:
    """Registro de providers de mensajeria activos."""

    def __init__(self):
        self._providers: dict[str, MessagingProvider] = {}
        self._default_channel: str = "telegram"

    def register(self, provider: MessagingProvider) -> None:
        """Registra un provider por su channel."""
        self._providers[provider.channel] = provider
        logger.info("Provider registrado: %s", provider.channel)

    def get(self, channel: str) -> Optional[MessagingProvider]:
        """Obtiene un provider por canal."""
        return self._providers.get(channel)

    async def send_message(
        self, recipient_id: str, text: str, channel: str | None = None
    ) -> None:
        """Envia mensaje por el canal especificado (o el default).

        Args:
            recipient_id: ID del destinatario
            text: Texto del mensaje
            channel: Canal a usar. Si es None, usa el default.
        """
        ch = channel or self._default_channel
        provider = self._providers.get(ch)
        if not provider:
            logger.warning("Provider '%s' no registrado. Intentando fallback...", ch)
            if self._providers:
                provider = next(iter(self._providers.values()))
            else:
                logger.error("No hay providers de mensajeria registrados")
                return
        await provider.send_message(recipient_id, text)

    async def start_all(self) -> None:
        """Inicia todos los providers registrados."""
        for channel, provider in self._providers.items():
            try:
                await provider.start()
                logger.info("Provider '%s' iniciado", channel)
            except Exception as e:
                logger.error("Error iniciando provider '%s': %s", channel, e)

    async def stop_all(self) -> None:
        """Detiene todos los providers registrados."""
        for channel, provider in self._providers.items():
            try:
                await provider.stop()
            except Exception as e:
                logger.error("Error deteniendo provider '%s': %s", channel, e)


# Singleton global
registry = ProviderRegistry()
