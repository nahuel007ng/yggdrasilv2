import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.bot.setup import create_bot_application

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
    yield
    await bot_app.updater.stop()
    await bot_app.stop()
    await bot_app.shutdown()
    logger.info("Bot de Telegram detenido")


app = FastAPI(title="Yggdrasil v2", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"status": "ok"}
