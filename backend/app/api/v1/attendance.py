from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Team, AttendanceRecord
from app.schemas.entities import QRScanRequest

router = APIRouter()


@router.get("/metrics")
def get_attendance_metrics(eventId: str = "evt-01", db: Session = Depends(get_db)):
    """Compute real-time attendance KPIs from database."""
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
def list_attendance_records(eventId: str = "evt-01", db: Session = Depends(get_db)):
    """Retrieve audit log of all hardware scans."""
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

