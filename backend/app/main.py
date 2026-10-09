import os
import sys
import time
from datetime import datetime, timezone
from contextlib import asynccontextmanager

# Ensure backend directory is in sys.path regardless of execution entrypoint
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.database.seed import seed_database
from app.api.v1.api import api_router
from app.api.v1.websocket import router as ws_router

startup_timestamp = time.time()



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and base seed dataset is initialized
    print("[EVENTOPS Backend] Initializing database models and tables...")
    Base.metadata.create_all(bind=engine)
    seed_database()
    print(f"[EVENTOPS Backend] Server online. Listening on port {settings.PORT}.")
    yield
    # Shutdown
    print("[EVENTOPS Backend] Server shutting down cleanly.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="EVENTOPS 2026 - Production-Grade Event Operations Platform with RBAC, QR Cryptography & OR-Tools Optimization",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
)

# Cross-Origin Resource Sharing (CORS)
cors_origins = list(set([
    settings.CLIENT_ORIGIN,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://rahul-tkrcet.github.io",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System Diagnostics"])
def health_check():
    """System health check and diagnostic probe."""
    db_status = "ONLINE"
    try:
        db = SessionLocal()
        bind = db.get_bind()
        if bind.dialect.name == "sqlite":
            db.execute(text("SELECT 1;"))
            db_status = "ONLINE (Persistent SQLite Dev Engine)"
        else:
            db.execute(text("SELECT 1;"))
            db_status = "ONLINE (External PostgreSQL 16)"
        db.close()
    except Exception as e:
        db_status = f"OFFLINE ({str(e)})"

    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptimeSeconds": int(time.time() - startup_timestamp),
        "database": db_status,
        "solvers": {
            "google_or_tools": "ACTIVE (CP-SAT v9.15)",
            "ai_constraint_engine": "ACTIVE",
        },
        "rbacRoles": "9 Roles Enforced",
    }


# Mount Routers
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(ws_router)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[Unhandled Server Error] {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected server error occurred. Please contact the administrator.",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)

