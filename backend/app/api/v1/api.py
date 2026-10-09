from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.api.deps import require_roles, User
from app.api.v1 import (
    auth,
    events,
    teams,
    venues,
    attendance,
    evaluation,
    allocation,
    incidents,
    resources,
    analytics,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(events.router, prefix="/events", tags=["Events & Stages"])
api_router.include_router(teams.router, prefix="/teams", tags=["Teams & Check-in"])
api_router.include_router(venues.router, prefix="/venues", tags=["Venues & Benches"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance & Hardware Scans"])
api_router.include_router(evaluation.router, prefix="/evaluation", tags=["Judge Evaluations & Scoring"])
api_router.include_router(allocation.router, prefix="/allocation", tags=["Constraint Optimization (OR-Tools)"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["Incidents & Dispatch"])
api_router.include_router(resources.router, prefix="/resources", tags=["Logistics & Meal Resources"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Executive Telemetry & KPIs"])


@api_router.get("/database/tables", tags=["System Governance"])
def list_database_tables(
    db: Session = Depends(get_db),
    _super: User = Depends(require_roles(["SUPER_ADMIN"])),
):
    """Secure database table inspector restricted to SUPER_ADMIN."""
    bind = db.get_bind()
    dialect_name = bind.dialect.name
    if dialect_name == "postgresql":
        result = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"))
        return [row[0] for row in result]
    elif dialect_name == "sqlite":
        result = db.execute(text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"))
        return [row[0] for row in result]
    return []

