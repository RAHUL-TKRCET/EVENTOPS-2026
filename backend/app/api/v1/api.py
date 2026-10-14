from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.api.deps import require_roles, User
from app.models.entities import Organization, Event, AuditLog
from app.api.v1.events import _is_platform_admin
from app.api.v1 import (
    auth,
    events,
    judges,
    teams,
    venues,
    attendance,
    evaluation,
    allocation,
    incidents,
    resources,
    analytics,
    invitations,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(events.router, prefix="/events", tags=["Events & Stages"])
api_router.include_router(judges.router, prefix="/judges", tags=["Judge Enrollment & Assignments"])
api_router.include_router(teams.router, prefix="/teams", tags=["Teams & Check-in"])
api_router.include_router(venues.router, prefix="/venues", tags=["Venues & Benches"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance & Hardware Scans"])
api_router.include_router(evaluation.router, prefix="/evaluation", tags=["Judge Evaluations & Scoring"])
api_router.include_router(allocation.router, prefix="/allocation", tags=["Constraint Optimization (OR-Tools)"])
api_router.include_router(incidents.router, prefix="/incidents", tags=["Incidents & Dispatch"])
api_router.include_router(resources.router, prefix="/resources", tags=["Logistics & Meal Resources"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Executive Telemetry & KPIs"])
api_router.include_router(invitations.router, prefix="/invitations", tags=["Secure Invitations"])


@api_router.get("/admin/overview", tags=["System Governance"])
def get_super_admin_overview(
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(["SUPER_ADMIN"])),
):
    """Return platform-wide aggregate metrics to an unscoped Super Admin only."""
    if not _is_platform_admin(actor):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Platform governance requires a global Super Admin session.")

    events = db.query(Event.status).all()
    status_counts = {}
    for (event_status,) in events:
        key = (event_status or "UNKNOWN").upper()
        status_counts[key] = status_counts.get(key, 0) + 1

    activity = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(8)
        .all()
    )
    return {
        "generatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "counts": {
            "organizations": db.query(Organization).count(),
            "users": db.query(User).count(),
            "events": len(events),
            "eventMembers": db.query(__import__("app.models.entities", fromlist=["EventMember"]).EventMember).count(),
            "auditRecords": db.query(AuditLog).count(),
        },
        "eventsByStatus": status_counts,
        "recentActivity": [
            {
                "id": item.id,
                "action": item.action,
                "resourceType": item.resource_type,
                "resourceId": item.resource_id,
                "eventId": item.event_id,
                "userRole": item.user_role,
                "createdAt": item.created_at.isoformat() if item.created_at else None,
            }
            for item in activity
        ],
    }


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

