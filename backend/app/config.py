from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_key: str

    # Telegram
    telegram_bot_token: str

    # LLM (DeepSeek V4-Flash)
    llm_api_key: str
    llm_base_url: str = "https://api.deepseek.com/v1"
    llm_model: str = "deepseek-v4-flash"

    # Notificaciones
    telegram_chat_id: int | None = None
    notification_morning_hour: int = 8
    notification_evening_hour: int = 20
    notification_timezone: str = "America/Argentina/Buenos_Aires"

    # WhatsApp (neonize)
    whatsapp_enabled: bool = False
    whatsapp_store_path: str = "./whatsapp_session"
    whatsapp_pair_phone: str | None = None

    # App
    debug: bool = False

    # Wake-On-LAN
    wol_target_mac: str | None = None
    wol_broadcast_ip: str = "255.255.255.255"

    # Validación de plausibilidad (0 = deshabilitado)
    max_study_minutes_without_confirm: int = 480     # 8 horas
    max_reading_minutes_without_confirm: int = 480
    max_expense_without_confirm: float = 500_000     # ARS

    class Config:
        env_file = ".env"


settings = Settings()
