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

    # App
    debug: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
