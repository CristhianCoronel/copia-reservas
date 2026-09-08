from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    app_env: str = "development"
    app_port: int = 4261
    secret_key: str
    access_token_expire_minutes: int = 1440
    database_url: str
    redis_url: str = "redis://localhost:6379/0"
    google_client_id: str = ""
    google_client_secret: str = ""
    
    cors_origins: List[str] = ["*"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
