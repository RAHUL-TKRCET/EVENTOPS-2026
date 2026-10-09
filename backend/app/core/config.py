import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "EVENTOPS-2026 Core Backend"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = Field(default=5000, validation_alias="PORT")
    ENVIRONMENT: str = Field(default="development", validation_alias="NODE_ENV")

    # Database
    DATABASE_URL: Optional[str] = Field(default=None, validation_alias="DATABASE_URL")
    DB_HOST: str = Field(default="localhost", validation_alias="DB_HOST")
    DB_PORT: int = Field(default=5432, validation_alias="DB_PORT")
    DB_USER: str = Field(default="eventops_user", validation_alias="DB_USER")
    DB_PASSWORD: str = Field(default="eventops_password", validation_alias="DB_PASSWORD")
    DB_NAME: str = Field(default="eventops_db", validation_alias="DB_NAME")

    # Security & Tokens
    JWT_SECRET: str = Field(
        default="eventops_jwt_secret_dev_key_never_use_in_prod_2026",
        validation_alias="JWT_SECRET",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    QR_HMAC_SECRET: str = Field(
        default="eventops_qr_hmac_secret_dev_key_2026",
        validation_alias="QR_HMAC_SECRET",
    )

    # CORS
    CLIENT_ORIGIN: str = Field(default="http://localhost:3000", validation_alias="CLIENT_ORIGIN")
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://rahul-tkrcet.github.io",
    ]

    # Realtime & Caching
    REDIS_URL: Optional[str] = Field(default="redis://localhost:6379", validation_alias="REDIS_URL")

    # AI Integration
    AI_PROVIDER: str = Field(default="mock", validation_alias="AI_PROVIDER")  # "mock", "gemini", "openai"
    AI_API_KEY: Optional[str] = Field(default=None, validation_alias="AI_API_KEY")

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, v: str, info) -> str:
        env = os.getenv("NODE_ENV", "development")
        if env == "production" and ("dev_key" in v or len(v) < 32):
            raise ValueError("JWT_SECRET must be at least 32 characters in production.")
        return v

    model_config = {
        "env_file": ".env",
        "extra": "ignore",
    }


settings = Settings()

