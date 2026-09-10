from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union

class Settings(BaseSettings):
    app_env: str = "development"
    app_port: int = 4261
    secret_key: str
    access_token_expire_minutes: int = 1440
    database_url: str
    redis_url: str = "redis://localhost:6379/0"
    google_client_id: str = ""
    google_client_secret: str = ""
    
    cors_origins: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4261", "http://localhost:4263"]
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
