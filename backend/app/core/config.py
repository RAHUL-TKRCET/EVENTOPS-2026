import os
import secrets
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import AliasChoices, Field, model_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "EVENTOPS-2026 Core Backend"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = Field(default=5000, validation_alias="PORT")
    ENVIRONMENT: str = Field(default="development", validation_alias=AliasChoices("ENVIRONMENT", "NODE_ENV"))

    # Database
    DATABASE_URL: Optional[str] = Field(default=None, validation_alias="DATABASE_URL")
    DB_HOST: str = Field(default="localhost", validation_alias="DB_HOST")
    DB_PORT: int = Field(default=5432, validation_alias="DB_PORT")
    DB_USER: str = Field(default="eventops_user", validation_alias="DB_USER")
    DB_PASSWORD: str = Field(default="eventops_password", validation_alias="DB_PASSWORD")
    DB_NAME: str = Field(default="eventops_db", validation_alias="DB_NAME")

    # Security & Tokens
    JWT_SECRET: str = Field(default="", validation_alias="JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    QR_HMAC_SECRET: str = Field(default="", validation_alias="QR_HMAC_SECRET")

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

    @model_validator(mode="after")
    def validate_runtime_security(self):
        production = self.ENVIRONMENT.strip().lower() in {"production", "prod"}
        insecure_defaults = {
            "eventops_jwt_secret_cloud_production_secure_2026_xyz",
            "eventops_qr_hmac_secret_cloud_2026_secure",
            "eventops_password",
        }
        if production:
            if not self.DATABASE_URL or not self.DATABASE_URL.startswith(("postgres://", "postgresql://", "postgresql+")):
                raise ValueError("DATABASE_URL must point to PostgreSQL in production.")
            if len(self.JWT_SECRET) < 32 or self.JWT_SECRET in insecure_defaults:
                raise ValueError("JWT_SECRET must be configured with a secure 32+ character production secret.")
            if len(self.QR_HMAC_SECRET) < 32 or self.QR_HMAC_SECRET in insecure_defaults:
                raise ValueError("QR_HMAC_SECRET must be configured with a secure 32+ character production secret.")
        else:
            if len(self.JWT_SECRET) < 32 or self.JWT_SECRET in insecure_defaults:
                object.__setattr__(self, "JWT_SECRET", secrets.token_urlsafe(48))
            if len(self.QR_HMAC_SECRET) < 32 or self.QR_HMAC_SECRET in insecure_defaults:
                object.__setattr__(self, "QR_HMAC_SECRET", secrets.token_urlsafe(48))
        return self

    model_config = {
        "env_file": ".env",
        "extra": "ignore",
    }


settings = Settings()
