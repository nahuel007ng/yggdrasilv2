"""API de biblioteca: CRUD de libros + aplicación/creación de tags.

Escrituras desde la webapp (/biblioteca). Mismo patrón que api/config.py:
el token se valida (get_current_user) pero el user_id de las filas sale de
get_user_id() (backend usuario-único).
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.chat import get_current_user
from app.db.supabase import get_supabase, get_user_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/biblioteca", tags=["biblioteca"])


# --- Modelos ---

class BookIn(BaseModel):
    title: str
    author: str | None = None
    status: str = "pendiente"          # pendiente|en_curso|leido|abandonado
    rating: float | None = None        # 0..5 en pasos de 0.5


class BookPatch(BaseModel):
    title: str | None = None
    author: str | None = None
    status: str | None = None
    rating: float | None = None


class TagIn(BaseModel):
    name: str
    color: str | None = "#8a93c2"


class SetTagsIn(BaseModel):
    tag_ids: list[str] = []


def _patch_data(body: BaseModel) -> dict:
    """Campos explícitos del PATCH (exclude_unset permite setear NULL a propósito)."""
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="Body vacío: nada para actualizar")
    return data


# --- Libros ---

@router.get("/books")
async def list_books(_: str = Depends(get_current_user)):
    sb = get_supabase()
    books = sb.table("books").select("*").order("created_at", desc=True).execute().data
    links = sb.table("book_tags").select("book_id, tags(id,name,color)").execute().data
    by_book: dict = {}
    for link in links:
        if link.get("tags"):
            by_book.setdefault(link["book_id"], []).append(link["tags"])
    for b in books:
        b["tags"] = by_book.get(b["id"], [])
    return books


@router.post("/books")
async def create_book(body: BookIn, _: str = Depends(get_current_user)):
    row = {**body.model_dump(), "user_id": get_user_id()}
    return get_supabase().table("books").insert(row).execute().data[0]


@router.patch("/books/{bid}")
async def update_book(bid: str, body: BookPatch, _: str = Depends(get_current_user)):
    data = get_supabase().table("books").update(_patch_data(body)).eq("id", bid).execute().data
    if not data:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    return data[0]


@router.delete("/books/{bid}")
async def delete_book(bid: str, _: str = Depends(get_current_user)):
    get_supabase().table("books").delete().eq("id", bid).execute()
    return {"ok": True}


@router.put("/books/{bid}/tags")
async def set_book_tags(bid: str, body: SetTagsIn, _: str = Depends(get_current_user)):
    """Reemplaza el set de tags del libro por el provisto."""
    sb = get_supabase()
    sb.table("book_tags").delete().eq("book_id", bid).execute()
    if body.tag_ids:
        sb.table("book_tags").insert(
            [{"book_id": bid, "tag_id": t} for t in body.tag_ids]
        ).execute()
    return {"ok": True}


# --- Tags (aplicar/crear al vuelo desde /biblioteca) ---

@router.get("/tags")
async def list_tags(_: str = Depends(get_current_user)):
    return get_supabase().table("tags").select("*").order("name").execute().data


@router.post("/tags")
async def create_tag(body: TagIn, _: str = Depends(get_current_user)):
    """Crea (o devuelve la existente por (user_id, name)) una tag."""
    row = {"name": body.name, "color": body.color, "user_id": get_user_id()}
    return get_supabase().table("tags").upsert(row, on_conflict="user_id,name").execute().data[0]
