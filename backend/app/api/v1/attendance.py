from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Team, AttendanceRecord, User
from app.api.deps import get_current_user
from app.api.event_access import ensure_event_access, get_event_or_404
from app.schemas.entities import QRScanRequest

router = APIRouter()


@router.get("/metrics")
def get_attendance_metrics(
    eventId: str = "evt-01",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compute attendance KPIs only for authorized event operations staff."""
    event = get_event_or_404(eventId, db)
    ensure_event_access(event, current_user, db, required_roles={"SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR", "VOLUNTEER", "TECHNICAL_STAFF"})
    teams = db.query(Team).filter(Team.event_id == eventId).all()
    total = len(teams)
    checked_in = sum(1 for t in teams if t.check_in_status == "CHECKED_IN")
    partial = sum(1 for t in teams if t.check_in_status == "PARTIAL")
    absent = total - checked_in - partial

    rate = round(((checked_in + (partial * 0.5)) / total) * 100) if total > 0 else 0

    recent_records = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.event_id == eventId)
        .order_by(AttendanceRecord.scan_timestamp.desc())
        .limit(10)
        .all()
    )

    recent_checkins = []
    for r in recent_records:
        team = db.query(Team).filter(Team.id == r.team_id).first()
        recent_checkins.append({
            "teamId": r.team_id,
            "teamName": team.name if team else "Team",
            "checkedInTime": r.scan_timestamp.isoformat() if r.scan_timestamp else None,
            "status": r.verification_status,
            "benchConfirmed": r.bench_confirmed,
        })

    return {
        "total": total,
        "checkedIn": checked_in,
        "partial": partial,
        "absent": absent,
        "checkInRatePct": rate,
        "recentCheckIns": recent_checkins,
    }


@router.get("/records")
def list_attendance_records(
    eventId: str = "evt-01",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve attendance audit records only for authorized event operations staff."""
    event = get_event_or_404(eventId, db)
    ensure_event_access(event, current_user, db, required_roles={"SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR", "TECHNICAL_STAFF"})
    records = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.event_id == eventId)
        .order_by(AttendanceRecord.scan_timestamp.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "teamId": r.team_id,
            "memberId": r.member_id,
            "scannedBy": r.scanned_by_user_id,
            "timestamp": r.scan_timestamp.isoformat() if r.scan_timestamp else None,
            "verificationStatus": r.verification_status,
            "benchConfirmed": r.bench_confirmed,
        }
        for r in records
    ]

