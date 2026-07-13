from datetime import date

from app.db.supabase import get_supabase, get_user_id
from app.models.schemas import ParsedPayload


async def add_savings(payload: ParsedPayload) -> dict:
    """Registra un depósito de ahorro."""
    supabase = get_supabase()

    entry = {
        "amount": payload.amount or 0,
        "type": "deposit",
        "description": payload.description or "Ahorro",
        "date": (payload.date or date.today()).isoformat(),
        "user_id": get_user_id(),
    }

    supabase.table("savings_transactions").insert(entry).execute()

    return {
        "success": True,
        "amount": payload.amount,
        "description": entry["description"],
    }


async def withdraw_savings(payload: ParsedPayload) -> dict:
    """Registra un retiro de ahorro."""
    supabase = get_supabase()

    entry = {
        "amount": payload.amount or 0,
        "type": "withdrawal",
        "description": payload.description or "Retiro de ahorros",
        "date": (payload.date or date.today()).isoformat(),
        "user_id": get_user_id(),
    }

    supabase.table("savings_transactions").insert(entry).execute()

    return {
        "success": True,
        "amount": payload.amount,
        "description": entry["description"],
    }
