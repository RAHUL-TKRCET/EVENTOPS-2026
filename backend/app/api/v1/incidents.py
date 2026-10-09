import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import Incident, User
from app.schemas.entities import IncidentCreate, IncidentUpdate
from app.api.deps import get_current_user

router = APIRouter()


@router.get("")
def list_incidents(eventId: str = "evt-01", db: Session = Depends(get_db)):
    """List operational incidents and alerts."""
    incidents = db.query(Incident).filter(Incident.event_id == eventId).order_by(Incident.reported_at.desc()).all()
    return [
        {
            "id": inc.id,
            "eventId": inc.event_id,
            "title": inc.title,
            "description": inc.description,
            "category": inc.category,
            "severity": inc.severity,
            "status": inc.status,
            "location": inc.location,
            "reportedBy": inc.reported_by,
            "assignedTo": inc.assigned_to,
            "resolutionNotes": inc.resolution_notes,
            "reportedAt": inc.reported_at.isoformat() if inc.reported_at else None,
            "resolvedAt": inc.resolved_at.isoformat() if inc.resolved_at else None,
        }
        for inc in incidents
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def report_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    """Report a new operational incident."""
    new_inc = Incident(
        id=f"inc-{uuid.uuid4().hex[:6]}",
        event_id=payload.eventId,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        severity=payload.severity,
        status="OPEN",
        location=payload.location,
        reported_by=payload.reportedBy,
    )
    db.add(new_inc)
    db.commit()
    db.refresh(new_inc)
    return {
        "id": new_inc.id,
        "eventId": new_inc.event_id,
        "title": new_inc.title,
        "severity": new_inc.severity,
        "status": new_inc.status,
        "location": new_inc.location,
        "reportedAt": new_inc.reported_at.isoformat() if new_inc.reported_at else None,
    }


@router.patch("/{incident_id}")
def update_incident(incident_id: str, payload: IncidentUpdate, db: Session = Depends(get_db)):
    """Update incident status and dispatch assignment."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    if payload.status:
        inc.status = payload.status
        if payload.status == "RESOLVED":
            inc.resolved_at = datetime.now(timezone.utc)
    if payload.assignedTo is not None:
        inc.assigned_to = payload.assignedTo
    if payload.resolutionNotes is not None:
        inc.resolution_notes = payload.resolutionNotes

    db.commit()
    return {"id": inc.id, "status": inc.status, "assignedTo": inc.assigned_to}

