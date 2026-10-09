import os
import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.core.config import settings

logger = logging.getLogger("eventops.database")

Base = declarative_base()


def resolve_database_url() -> str:
    """Resolve database URL with explicit production vs development isolation.
    
    In production, DATABASE_URL must be a valid PostgreSQL connection string.
    In local development, if external PostgreSQL is unavailable, an explicit
    persisted SQLite engine in backend/data/eventops.db is initialized.
    """
    raw_url = settings.DATABASE_URL

    if raw_url and raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)

    if raw_url:
        return raw_url

    # Check constructed PostgreSQL URI if DB_HOST is configured
    if settings.DB_HOST != "localhost" or os.environ.get("DB_HOST"):
        pg_url = f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
        return pg_url

    # Local development & fallback persistent SQLite storage
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))
    os.makedirs(data_dir, exist_ok=True)
    db_file = os.path.join(data_dir, "eventops.db")
    dev_sqlite_url = f"sqlite:///{db_file}"

    if settings.ENVIRONMENT == "production":
        logger.warning(
            "WARNING: DATABASE_URL is not configured in production environment. "
            "Falling back to local persistent SQLite at %s. "
            "For production deployments, please configure the DATABASE_URL environment variable with your PostgreSQL connection string.",
            db_file,
        )
    else:
        logger.info("External PostgreSQL not configured. Using local development SQLite persistence at %s", db_file)

    return dev_sqlite_url


DATABASE_URL = resolve_database_url()

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

