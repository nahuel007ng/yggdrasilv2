import asyncio
import logging
from pathlib import Path
from typing import Callable, Awaitable

logger = logging.getLogger(__name__)

MessageHandlerCallback = Callable[[str, str, str], Awaitable[str]]


class WhatsAppProvider:
    """Provider de mensajeria para WhatsApp usando neonize."""

    channel = "whatsapp"

    def __init__(
        self,
        store_path: str,
        message_handler_callback: MessageHandlerCallback | None = None,
    ):
        """
        Args:
            store_path: Path al directorio donde neonize guarda las credenciales de sesion
            message_handler_callback: async fn(sender_id, text, channel) -> str
        """
        self.store_path = store_path
        self._message_handler_callback = message_handler_callback
        self._client = None

    async def start(self) -> None:
        """Inicia la conexion con WhatsApp via neonize.

        Si no hay sesion guardada, muestra QR code en terminal para escanear.
        Si hay sesion guardada, reconecta automaticamente.
        """
        try:
            try:
                import pylibmagic  # noqa: F401 — provee libmagic en entornos sin la lib del sistema (ej. Render)
            except ImportError:
                pass

            from neonize.aioze.client import NewAClient
            from neonize.aioze.events import ConnectedEv, MessageEv

            store_path = Path(self.store_path)
            store_path.mkdir(parents=True, exist_ok=True)

            self._client = NewAClient(str(store_path / "whatsapp_session"))

            @self._client.event(MessageEv)
            async def on_message(client, event: MessageEv):
                # Filtrar mensajes propios y de grupos
                source = event.Info.MessageSource
                if source.IsFromMe or source.IsGroup:
                    return

                # Extraer texto del mensaje
                text = event.Message.conversation
                if not text and event.Message.extendedTextMessage.text:
                    text = event.Message.extendedTextMessage.text
                if not text:
                    return

                sender_jid = f"{source.Sender.User}@{source.Sender.Server}"

                # Guardar JID en user_profile
                try:
                    await self._save_whatsapp_jid(sender_jid)
                except Exception:
                    logger.exception("Error guardando WhatsApp JID")

                if self._message_handler_callback:
                    try:
                        response = await self._message_handler_callback(
                            sender_jid,
                            text,
                            "whatsapp",
                        )
                        if response:
                            from neonize.utils import build_jid

                            recipient = build_jid(source.Sender.User)
                            await client.send_message(recipient, response)
                    except Exception:
                        logger.exception("Error procesando mensaje WhatsApp")

            @self._client.event(ConnectedEv)
            async def on_connected(client, event: ConnectedEv):
                logger.info("WhatsApp conectado exitosamente")

            logger.info("Iniciando conexion WhatsApp... (escanea el QR si aparece)")

            # connect() bloquea hasta desconexion, correrlo en background
            asyncio.create_task(self._run_client())

        except ImportError:
            logger.error(
                "neonize no esta instalado. Instalar con: pip install neonize. "
                "WhatsApp provider no disponible."
            )
            raise
        except Exception:
            logger.exception("Error iniciando WhatsApp provider")
            raise

    async def _run_client(self) -> None:
        """Corre el client en background (connect + idle)."""
        try:
            await self._client.connect()
            await self._client.idle()
        except Exception:
            logger.exception("WhatsApp client se desconecto")

    async def stop(self) -> None:
        """Cierra la conexion con WhatsApp."""
        if self._client:
            try:
                await self._client.disconnect()
                logger.info("WhatsApp desconectado")
            except Exception:
                logger.exception("Error desconectando WhatsApp")

    async def send_message(self, recipient_id: str, text: str) -> None:
        """Envia mensaje de texto via WhatsApp.

        Args:
            recipient_id: JID del destinatario (ej: '5493834XXXXXX@s.whatsapp.net')
            text: Texto del mensaje
        """
        if not self._client:
            logger.error("WhatsApp client no inicializado")
            return

        try:
            from neonize.utils import build_jid

            # recipient_id puede ser 'user@server' o solo el numero
            if "@" in recipient_id:
                user = recipient_id.split("@")[0]
            else:
                user = recipient_id

            jid = build_jid(user)
            await self._client.send_message(jid, text)
        except Exception:
            logger.exception("Error enviando mensaje WhatsApp a %s", recipient_id)

    async def _save_whatsapp_jid(self, jid: str) -> None:
        """Guarda el JID de WhatsApp del usuario en user_profile."""
        from app.db.supabase import get_supabase

        try:
            supabase = get_supabase()
            result = (
                supabase.table("user_profile")
                .select("id, whatsapp_jid")
                .limit(1)
                .execute()
            )
            if result.data:
                profile = result.data[0]
                if profile.get("whatsapp_jid") != jid:
                    supabase.table("user_profile").update(
                        {"whatsapp_jid": jid}
                    ).eq("id", profile["id"]).execute()
                    logger.info("WhatsApp JID guardado: %s", jid)
        except Exception:
            logger.exception("Error guardando WhatsApp JID")
