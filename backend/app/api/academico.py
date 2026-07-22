"""API académica: editar materias (estado/nota) y CRUD de exámenes.

Escrituras desde la webapp (/estudios). El backend es usuario-único:
el token se valida (get_current_user) pero el user_id de las filas sale de
get_user_id(), igual que el resto del backend. El catálogo de materias
(38, seedeadas) no se crea ni borra desde acá — solo se edita status/grade.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.chat import get_current_user
from app.db.supabase import get_supabase, get_user_id
from app.services.study import VALID_STATUS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/academico", tags=["academico"])

VALID_EXAM_TYPES = {"parcial", "tp", "final", "otro"}


# --- Modelos ---

class SubjectPatch(BaseModel):
    status: str | None = None      # aprobada | cursando | pendiente
    grade: int | None = None


class ExamIn(BaseModel):
    subject_id: str
    type: str = "final"            # parcial | tp | final | otro
    grade: float | None = None
    date: str | None = None        # YYYY-MM-DD
    notes: str | None = None


class ExamPatch(BaseModel):
    type: str | None = None
    grade: float | None = None
    date: str | None = None
    notes: str | None = None


def _patch_data(body: BaseModel) -> dict:
    """Campos explícitos del PATCH (exclude_unset permite setear NULL a propósito)."""
    data = body.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="Body vacío: nada para actualizar")
    return data


def _validate_status(status: str | None) -> None:
    # subjects.status no tiene CHECK en DB: validar acá evita estados con typo.
    if status is not None and status not in VALID_STATUS:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido '{status}'. Válidos: {', '.join(sorted(VALID_STATUS))}",
        )


def _validate_exam_type(exam_type: str | None) -> None:
    # El CHECK de DB lo rechazaría igual, pero con un 500 críptico; mejor 400 claro.
    if exam_type is not None and exam_type not in VALID_EXAM_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo inválido '{exam_type}'. Válidos: {', '.join(sorted(VALID_EXAM_TYPES))}",
        )


# --- Materias (solo editar estado/nota; el catálogo ya está seedeado) ---

@router.get("/subjects")
async def list_subjects(_: str = Depends(get_current_user)):
    return get_supabase().table("subjects").select("*").order("code").execute().data


@router.patch("/subjects/{sid}")
async def update_subject(sid: str, body: SubjectPatch, _: str = Depends(get_current_user)):
    data = _patch_data(body)
    _validate_status(data.get("status"))
    result = get_supabase().table("subjects").update(data).eq("id", sid).execute().data
    if not result:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    return result[0]


# --- Exámenes (CRUD) ---

@router.get("/exams")
async def list_exams(_: str = Depends(get_current_user)):
    # subjects(name) llega anidado: {"subjects": {"name": ...}} (gotcha joins de Supabase)
    return (
        get_supabase().table("exams").select("*, subjects(name)")
        .order("date").execute().data
    )


@router.post("/exams")
async def create_exam(body: ExamIn, _: str = Depends(get_current_user)):
    _validate_exam_type(body.type)
    row = {**body.model_dump(exclude_none=True), "user_id": get_user_id()}
    return get_supabase().table("exams").insert(row).execute().data[0]


@router.patch("/exams/{eid}")
async def update_exam(eid: str, body: ExamPatch, _: str = Depends(get_current_user)):
    data = _patch_data(body)
    _validate_exam_type(data.get("type"))
    result = get_supabase().table("exams").update(data).eq("id", eid).execute().data
    if not result:
        raise HTTPException(status_code=404, detail="Examen no encontrado")
    return result[0]


@router.delete("/exams/{eid}")
async def delete_exam(eid: str, _: str = Depends(get_current_user)):
    get_supabase().table("exams").delete().eq("id", eid).execute()
    return {"ok": True}
