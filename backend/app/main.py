import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.bot.setup import create_bot_application
from app.scheduler import start_scheduler

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

bot_app = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global bot_app
    bot_app = create_bot_application()
    await bot_app.initialize()
    await bot_app.start()
    await bot_app.updater.start_polling()
    logger.info("Bot de Telegram iniciado en modo polling")

    # Iniciar scheduler de notificaciones
    scheduler = start_scheduler()

    yield

    scheduler.shutdown()
    logger.info("Scheduler de notificaciones detenido")
    await bot_app.updater.stop()
    await bot_app.stop()
    await bot_app.shutdown()
    logger.info("Bot de Telegram detenido")


app = FastAPI(title="Yggdrasil v2", lifespan=lifespan)


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
