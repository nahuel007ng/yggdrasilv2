from fastapi import APIRouter, Depends, HTTPException

from app.api.chat import get_current_user
from app.config import settings
from app.services.wol import send_magic_packet

router = APIRouter(prefix="/api/wol", tags=["wol"])


@router.post("/wake")
async def wake_pc(user_id: str = Depends(get_current_user)):
    if not settings.wol_target_mac:
        raise HTTPException(status_code=503, detail="WOL_TARGET_MAC no configurado")
    try:
        send_magic_packet(settings.wol_target_mac, settings.wol_broadcast_ip)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"status": "sent", "target": settings.wol_target_mac}
