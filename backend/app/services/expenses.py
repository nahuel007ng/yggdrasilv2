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


async def add_expected_transaction(payload: ParsedPayload) -> dict:
    """Registra una transacción esperada (pendiente) con fecha futura."""
    supabase = get_supabase()

    # Determinar tipo (income/expense)
    tx_type = payload.transaction_type or "expense"
    if tx_type not in ("income", "expense"):
        tx_type = "expense"

    # Buscar categoría si viene
    category_id = None
    if payload.category:
        result = (
            supabase.table("categories")
            .select("id")
            .ilike("name", payload.category)
            .eq("type", tx_type)
            .execute()
        )
        if result.data:
            category_id = result.data[0]["id"]

    # Buscar cuenta default
    account_result = supabase.table("accounts").select("id").eq("is_default", True).execute()
    account_id = account_result.data[0]["id"] if account_result.data else None

    # expected_date es la fecha en que se espera cobrar/pagar
    expected_date = (payload.date or date.today()).isoformat()

    # Insertar transacción con status='pending'
    transaction = {
        "account_id": account_id,
        "category_id": category_id,
        "amount": payload.amount or 0,
        "type": tx_type,
        "description": payload.description or "",
        "date": date.today().isoformat(),
        "status": "pending",
        "expected_date": expected_date,
        "user_id": get_user_id(),
    }

    result = supabase.table("transactions").insert(transaction).execute()
    tx_id = result.data[0]["id"] if result.data else None

    return {
        "success": True,
        "id": tx_id,
        "amount": payload.amount,
        "type": tx_type,
        "description": payload.description,
        "expected_date": expected_date,
    }


async def confirm_transaction(payload: ParsedPayload) -> dict:
    """Confirma o cancela una transacción pendiente."""
    supabase = get_supabase()

    if not payload.transaction_id:
        return {"success": False, "error": "No se especificó qué transacción confirmar."}

    # Buscar la transacción
    result = (
        supabase.table("transactions")
        .select("*")
        .eq("id", payload.transaction_id)
        .eq("status", "pending")
        .eq("user_id", get_user_id())
        .execute()
    )

    if not result.data:
        return {"success": False, "error": "Transacción pendiente no encontrada."}

    tx = result.data[0]

    if payload.confirmed:
        # Confirmar: actualizar status y fecha real
        update_data: dict = {
            "status": "completed",
            "date": date.today().isoformat(),
        }
        if payload.actual_amount is not None:
            update_data["amount"] = payload.actual_amount

        supabase.table("transactions").update(update_data).eq("id", tx["id"]).execute()

        final_amount = payload.actual_amount if payload.actual_amount is not None else tx["amount"]
        return {
            "success": True,
            "confirmed": True,
            "id": tx["id"],
            "amount": final_amount,
            "original_amount": tx["amount"],
            "amount_changed": payload.actual_amount is not None and payload.actual_amount != tx["amount"],
        }
    else:
        # Cancelar: eliminar la transacción
        supabase.table("transactions").delete().eq("id", tx["id"]).execute()
        return {
            "success": True,
            "confirmed": False,
            "id": tx["id"],
        }
