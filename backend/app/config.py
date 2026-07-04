from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_key: str

    # Telegram
    telegram_bot_token: str

    # LLM (OpenCode / Minimax)
    opencode_api_key: str
    opencode_base_url: str = "https://opencode.ai/api/v1"
    llm_model: str = "minimax-m2.5"

    # App
    debug: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
