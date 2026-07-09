from supabase import create_client, Client
from app.config import settings

_client: Client | None = None
_cached_user_id: str | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_key)
    return _client


def get_user_id() -> str:
    """Obtiene el user_id (UUID de Supabase Auth) del unico usuario del sistema."""
    global _cached_user_id
    if _cached_user_id:
        return _cached_user_id
    supabase = get_supabase()
    result = supabase.table("user_profile").select("user_id").limit(1).execute()
    if result.data and result.data[0].get("user_id"):
        _cached_user_id = result.data[0]["user_id"]
        return _cached_user_id
    raise ValueError("No se encontro user_id en user_profile. Ejecutar migration-auth.sql primero.")
