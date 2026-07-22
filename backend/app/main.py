import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.academico import router as academico_router
from app.api.chat import router as chat_router
from app.api.config import router as config_router
from app.api.wol import router as wol_router
from app.config import settings
from app.messaging.registry import registry
from app.messaging.telegram_provider import TelegramProvider
from app.bot.handlers import parse_and_execute
from app.scheduler import start_scheduler

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


async def _message_handler(sender_id: str, text: str, channel: str) -> str:
    """Callback para providers: procesa mensaje y devuelve respuesta."""
    return await parse_and_execute(text)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Registrar Telegram provider
    telegram_provider = TelegramProvider(
        token=settings.telegram_bot_token,
        message_handler_callback=_message_handler,
    )
    registry.register(telegram_provider)

    # Registrar WhatsApp provider si esta habilitado
    if settings.whatsapp_enabled:
        from app.messaging.whatsapp_provider import WhatsAppProvider

        whatsapp_provider = WhatsAppProvider(
            store_path=settings.whatsapp_store_path,
            message_handler_callback=_message_handler,
        )
        registry.register(whatsapp_provider)

    # Iniciar todos los providers
    await registry.start_all()

    # Iniciar scheduler de notificaciones
    scheduler = start_scheduler()

    yield

    scheduler.shutdown()
    logger.info("Scheduler de notificaciones detenido")
    await registry.stop_all()
    logger.info("Providers de mensajeria detenidos")


app = FastAPI(title="Yggdrasil v2", lifespan=lifespan)

# CORS para la webapp en local y Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(academico_router)
app.include_router(chat_router)
app.include_router(config_router)
app.include_router(wol_router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/debug/morning-summary")
async def debug_morning_summary():
    """Endpoint temporal para testear el resumen matutino. Eliminar antes de produccion."""
    from app.scheduler import job_morning_summary

    await job_morning_summary()
    return {"status": "sent"}


@app.get("/debug/evening-habits")
async def debug_evening_habits():
    """Endpoint temporal para testear habitos vespertinos. Eliminar antes de produccion."""
    from app.scheduler import job_evening_habits

    await job_evening_habits()
    return {"status": "sent"}


@app.get("/debug/check-reminders")
async def debug_check_reminders():
    """Endpoint temporal para testear check de recordatorios. Eliminar antes de produccion."""
    from app.scheduler import job_check_reminders

    await job_check_reminders()
    return {"status": "sent"}


@app.get("/debug/daily-quests")
async def debug_daily_quests():
    """Endpoint temporal para testear generacion de daily quests."""
    from app.services.daily_quests import get_today_quests

    quests = await get_today_quests()
    return {"quests": quests, "count": len(quests)}
