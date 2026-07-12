import logging

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from app.db.supabase import get_supabase
from app.llm.parser import parse_message
from app.models.schemas import ParseError
from app.services.action_router import execute_action

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    xp_gained: int | None = None
    level: int | None = None
    badges_earned: list[str] | None = None


async def get_current_user(authorization: str = Header(None)) -> str:
    """Extrae y valida el user_id desde el JWT de Supabase Auth."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token requerido")

    token = authorization.split(" ", 1)[1]
    try:
        supabase = get_supabase()
        user = supabase.auth.get_user(token)
        if not user or not user.user or not user.user.id:
            raise HTTPException(status_code=401, detail="Token invalido")
        return user.user.id
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Error validando JWT de Supabase: %s", exc)
        raise HTTPException(status_code=401, detail="Token invalido") from exc


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, user_id: str = Depends(get_current_user)):
    """Procesa un mensaje de texto con el mismo pipeline NLU del bot de Telegram."""
    logger.info("Mensaje de chat recibido de %s: %s", user_id, req.message)

    # 1. Parsear mensaje con LLM
    parsed = await parse_message(req.message)

    if isinstance(parsed, ParseError):
        logger.info("ParseError para mensaje de chat: %s", parsed.error)
        return ChatResponse(
            reply=f"No pude procesar tu mensaje. {parsed.error}\nIntentá reformularlo.",
            xp_gained=0,
            level=None,
            badges_earned=[],
        )

    # 2. Ejecutar acción (misma lógica que el bot)
    result = await execute_action(parsed, user_id=user_id)

    # 3. Devolver respuesta estructurada
    return ChatResponse(
        reply=result["reply"],
        xp_gained=result.get("xp_gained"),
        level=result.get("level"),
        badges_earned=result.get("badges_earned"),
    )
