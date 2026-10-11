import os
import sys
import time
from datetime import datetime, timezone
from contextlib import asynccontextmanager

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.database.seed import seed_database
from app.api.v1.api import api_router
from app.api.v1.websocket import router as ws_router

startup_timestamp = time.time()

@asynccontextmanager
async def lifespan(app: FastAPI):
    environment = settings.ENVIRONMENT.strip().lower()
    if settings.AUTO_CREATE_SCHEMA:
        if environment in {"production", "prod"}:
            raise RuntimeError("AUTO_CREATE_SCHEMA must never be enabled in production.")
        Base.metadata.create_all(bind=engine)
        seed_database()
    else:
        inspector = inspect(engine)
        schema_name = "public" if engine.dialect.name == "postgresql" else None
        existing_tables = set(inspector.get_table_names(schema=schema_name))
        required_tables = set(Base.metadata.tables.keys())
        missing_tables = sorted(required_tables - existing_tables)
        if missing_tables:
            raise RuntimeError("Database schema is missing required tables: " + ", ".join(missing_tables) + ". Apply the reviewed migration plan before starting the backend.")
        print("[EVENTOPS Backend] Existing schema validated; runtime DDL and demo seeding skipped.")
    print(f"[EVENTOPS Backend] Server online. Listening on port {settings.PORT}.")
    yield
    print("[EVENTOPS Backend] Server shutting down cleanly.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="EVENTOPS 2026 - Event Operations Platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
)

cors_origins = sorted({
    origin.strip().rstrip("/")
    for origin in [settings.CLIENT_ORIGIN, *settings.ALLOWED_ORIGINS, "http://localhost:3000", "http://127.0.0.1:3000", "https://rahul-tkrcet.github.io"]
    if origin and origin.strip()
})
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health", tags=["System Diagnostics"])
def health_check():
    db_status = "ONLINE"
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
            db_status = "ONLINE (SQLite development)" if db.get_bind().dialect.name == "sqlite" else "ONLINE (PostgreSQL)"
    except Exception:
        db_status = "OFFLINE"
    return {
        "status": "HEALTHY" if db_status != "OFFLINE" else "DEGRADED",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptimeSeconds": int(time.time() - startup_timestamp),
        "database": db_status,
    }

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(ws_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[Unhandled Server Error] {request.method} {request.url}: {exc}")
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"error": "InternalServerError", "message": "An unexpected server error occurred. Please contact the administrator."})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
