from datetime import date

from app.db.supabase import get_supabase, get_user_id
from app.models.schemas import ParsedPayload


async def add_expense(payload: ParsedPayload) -> dict:
    """Registra un gasto en Supabase."""
    supabase = get_supabase()

    # Buscar la categoría por nombre (case-insensitive)
    category_id = None
    if payload.category:
        result = (
            supabase.table("categories")
            .select("id")
            .ilike("name", payload.category)
            .eq("type", "expense")
            .execute()
        )
        if result.data:
            category_id = result.data[0]["id"]

    # Buscar la cuenta default
    account_result = supabase.table("accounts").select("id").eq("is_default", True).execute()
    account_id = account_result.data[0]["id"] if account_result.data else None

    # Insertar transacción
    transaction = {
        "account_id": account_id,
        "category_id": category_id,
        "amount": payload.amount or 0,
        "type": "expense",
        "description": payload.description or "",
        "date": (payload.date or date.today()).isoformat(),
        "user_id": get_user_id(),
    }

    result = supabase.table("transactions").insert(transaction).execute()

    return {
        "success": True,
        "amount": payload.amount,
        "category": payload.category or "Sin categoría",
        "description": payload.description,
    }
