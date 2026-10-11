import logging
import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("eventops.database")
Base = declarative_base()

def resolve_database_url() -> str:
    """Resolve PostgreSQL for production and explicit SQLite for local development."""
    raw_url = settings.DATABASE_URL
    if raw_url and raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif raw_url and raw_url.startswith("postgresql://"):
        raw_url = raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif raw_url and raw_url.startswith("postgresql+psycopg://"):
        raw_url = raw_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
    if raw_url:
        return raw_url
    if settings.DB_HOST != "localhost" or os.environ.get("DB_HOST"):
        if not settings.DB_PASSWORD:
            raise RuntimeError("DB_PASSWORD must be configured when DB_HOST is used.")
        return f"postgresql+psycopg2://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    if settings.ENVIRONMENT.strip().lower() in {"production", "prod"}:
        raise RuntimeError("DATABASE_URL or DB_HOST must be configured for PostgreSQL in production.")
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))
    os.makedirs(data_dir, exist_ok=True)
    sqlite_url = f"sqlite:///{os.path.join(data_dir, 'eventops.db')}"
    logger.info("Using local development SQLite persistence at %s", sqlite_url)
    return sqlite_url

DATABASE_URL = resolve_database_url()
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
