from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    openai_api_key: str
    gemini_api_key: str
    anthropic_api_key: str
    internal_api_key: str
    resend_api_key: Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()
