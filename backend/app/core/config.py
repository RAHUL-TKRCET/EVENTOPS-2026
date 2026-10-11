import secrets
from typing import List, Optional
from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "EVENTOPS-2026 Core Backend"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = Field(default=5000, validation_alias="PORT")
    ENVIRONMENT: str = Field(default="development", validation_alias=AliasChoices("ENVIRONMENT", "NODE_ENV"))
    AUTO_CREATE_SCHEMA: bool = Field(default=False, validation_alias="AUTO_CREATE_SCHEMA")
    DATABASE_URL: Optional[str] = Field(default=None, validation_alias="DATABASE_URL")
    DB_HOST: str = Field(default="localhost", validation_alias="DB_HOST")
    DB_PORT: int = Field(default=5432, validation_alias="DB_PORT")
    DB_USER: str = Field(default="eventops_user", validation_alias="DB_USER")
    DB_PASSWORD: str = Field(default="", validation_alias="DB_PASSWORD")
    DB_NAME: str = Field(default="eventops_db", validation_alias="DB_NAME")
    JWT_SECRET: str = Field(default="", validation_alias="JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    QR_HMAC_SECRET: str = Field(default="", validation_alias="QR_HMAC_SECRET")
    CLIENT_ORIGIN: str = Field(default="http://localhost:3000", validation_alias="CLIENT_ORIGIN")
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "https://rahul-tkrcet.github.io"]
    REDIS_URL: Optional[str] = Field(default="redis://localhost:6379", validation_alias="REDIS_URL")
    AI_PROVIDER: str = Field(default="mock", validation_alias="AI_PROVIDER")
    AI_API_KEY: Optional[str] = Field(default=None, validation_alias="AI_API_KEY")

    @model_validator(mode="after")
    def validate_runtime_security(self):
        production = self.ENVIRONMENT.strip().lower() in {"production", "prod"}
        if production:
            if not self.DATABASE_URL or not self.DATABASE_URL.startswith(("postgres://", "postgresql://", "postgresql+")):
                raise ValueError("DATABASE_URL must point to PostgreSQL in production.")
            if len(self.JWT_SECRET) < 32:
                raise ValueError("JWT_SECRET must be configured with a secure 32+ character production secret.")
            if len(self.QR_HMAC_SECRET) < 32:
                raise ValueError("QR_HMAC_SECRET must be configured with a secure 32+ character production secret.")
        else:
            if len(self.JWT_SECRET) < 32:
                object.__setattr__(self, "JWT_SECRET", secrets.token_urlsafe(48))
            if len(self.QR_HMAC_SECRET) < 32:
                object.__setattr__(self, "QR_HMAC_SECRET", secrets.token_urlsafe(48))
        return self

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
