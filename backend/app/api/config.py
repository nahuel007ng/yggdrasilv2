"""API de configuración: CRUD de categorías, hábitos, valores de XP y tags.

Escrituras desde la webapp (/configuracion). El backend es usuario-único:
el token se valida (get_current_user) pero el user_id de las filas sale de
get_user_id(), igual que el resto del backend.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.chat import get_current_user
from app.db.supabase import get_supabase, get_user_id
from app.llm.prompts import invalidate_catalog_cache
from app.services.gamification import invalidate_xp_config_cache

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/config", tags=["config"])


# --- Modelos ---

class CategoryIn(BaseModel):
    name: str
    icon: str | None = None
    color: str | None = None
    type: str | None = None


class CategoryPatch(BaseModel):
    name: str | None = None
    icon: str | None = None
    color: str | None = None
    type: str | None = None


class HabitIn(BaseModel):
    name: str
    description: str | None = None
    frequency: str | None = None
    icon: str | None = None
    color: str | None = None
    xp_override: int | None = None


class HabitPatch(BaseModel):
    name: str | None = None
    description: str | None = None
    frequency: str | None = None
    icon: str | None = None
    color: str | None = None
    xp_override: int | None = None
    is_archived: bool | None = None


class XpPatch(BaseModel):
    xp_per_unit: int | None = None
    unit_size: float | None = None
    unit_label: str | None = None
    cap_units: int | None = None


class TagIn(BaseModel):
    name: str
    color: str | None = "#8a93c2"


class TagPatch(BaseModel):
    name: str | None = None
    color: str | None = None


def _patch_data(body: BaseModel) -> dict:
    """Campos explícitos del PATCH (exclude_unset permite setear NULL a propósito)."""
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="Body vacío: nada para actualizar")
    return data


# --- Categorías de gastos ---

@router.get("/categories")
async def list_categories(_: str = Depends(get_current_user)):
    return get_supabase().table("categories").select("*").order("name").execute().data


@router.post("/categories")
async def create_category(body: CategoryIn, _: str = Depends(get_current_user)):
    row = {**body.model_dump(exclude_none=True), "user_id": get_user_id()}
    result = get_supabase().table("categories").insert(row).execute().data[0]
    invalidate_catalog_cache()  # el bot ve la categoría nueva al parsear el próximo mensaje
    return result


@router.patch("/categories/{cid}")
async def update_category(cid: str, body: CategoryPatch, _: str = Depends(get_current_user)):
    data = get_supabase().table("categories").update(_patch_data(body)).eq("id", cid).execute().data
    if not data:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    invalidate_catalog_cache()
    return data[0]


@router.delete("/categories/{cid}")
async def delete_category(cid: str, _: str = Depends(get_current_user)):
    # Se permite borrar categorías is_default (decisión del brief; el seed no se re-aplica solo).
    get_supabase().table("categories").delete().eq("id", cid).execute()
    invalidate_catalog_cache()
    return {"ok": True}


# --- Hábitos (binarios; xp_override = XP fijo propio, NULL = default TOGGLE_HABIT) ---

@router.get("/habits")
async def list_habits(_: str = Depends(get_current_user)):
    return (
        get_supabase().table("habits").select("*")
        .eq("is_archived", False).order("name").execute().data
    )


@router.post("/habits")
async def create_habit(body: HabitIn, _: str = Depends(get_current_user)):
    row = {**body.model_dump(exclude_none=True), "user_id": get_user_id()}
    result = get_supabase().table("habits").insert(row).execute().data[0]
    invalidate_catalog_cache()  # el bot reconoce el hábito nuevo en el próximo mensaje
    return result


@router.patch("/habits/{hid}")
async def update_habit(hid: str, body: HabitPatch, _: str = Depends(get_current_user)):
    data = get_supabase().table("habits").update(_patch_data(body)).eq("id", hid).execute().data
    if not data:
        raise HTTPException(status_code=404, detail="Hábito no encontrado")
    invalidate_catalog_cache()
    return data[0]


@router.delete("/habits/{hid}")
async def delete_habit(hid: str, _: str = Depends(get_current_user)):
    # Soft-delete: los habit_records históricos referencian el hábito.
    data = get_supabase().table("habits").update({"is_archived": True}).eq("id", hid).execute().data
    if not data:
        raise HTTPException(status_code=404, detail="Hábito no encontrado")
    invalidate_catalog_cache()
    return {"ok": True}


# --- XP config (solo listar + editar; las filas las crea la migración) ---

@router.get("/xp")
async def list_xp(_: str = Depends(get_current_user)):
    return get_supabase().table("xp_config").select("*").order("action_type").execute().data


@router.patch("/xp/{action_type}")
async def update_xp(action_type: str, body: XpPatch, _: str = Depends(get_current_user)):
    data = _patch_data(body)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = (
        get_supabase().table("xp_config").update(data)
        .eq("action_type", action_type).execute().data
    )
    if not result:
        raise HTTPException(status_code=404, detail=f"Acción '{action_type}' no existe en xp_config")
    invalidate_xp_config_cache()  # el cambio surte efecto en la próxima acción, sin redeploy
    return result[0]


# --- Tags (catálogo de etiquetas para Biblioteca) ---

@router.get("/tags")
async def list_tags(_: str = Depends(get_current_user)):
    return get_supabase().table("tags").select("*").order("name").execute().data


@router.post("/tags")
async def create_tag(body: TagIn, _: str = Depends(get_current_user)):
    row = {**body.model_dump(exclude_none=True), "user_id": get_user_id()}
    return get_supabase().table("tags").insert(row).execute().data[0]


@router.patch("/tags/{tid}")
async def update_tag(tid: str, body: TagPatch, _: str = Depends(get_current_user)):
    data = get_supabase().table("tags").update(_patch_data(body)).eq("id", tid).execute().data
    if not data:
        raise HTTPException(status_code=404, detail="Tag no encontrada")
    return data[0]


@router.delete("/tags/{tid}")
async def delete_tag(tid: str, _: str = Depends(get_current_user)):
    get_supabase().table("tags").delete().eq("id", tid).execute()
    return {"ok": True}
