"""Event-scoped volunteer workspace API.

Volunteers can view and advance only tasks assigned to their own volunteer
record in the event bound to their authenticated session.
"""
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.events import _active_role
from app.core.database import get_db
from app.models.entities import AuditLog, Event, User, Volunteer, VolunteerTask

router = APIRouter()

_TRANSITIONS = {
    "PENDING": {"ACCEPTED"},
    "ASSIGNED": {"ACCEPTED"},
    "ACCEPTED": {"IN_PROGRESS"},
    "IN_PROGRESS": {"COMPLETED"},
}


def _require_volunteer_assignment(db: Session, actor: User, event_id: str) -> Volunteer:
    if _active_role(actor) != "VOLUNTEER":
        raise HTTPException(status_code=403, detail="Only a volunteer session can access this workspace.")
    active_event_id = getattr(actor, "active_event_id", None)
    if not active_event_id or active_event_id != event_id:
        raise HTTPException(status_code=403, detail="The volunteer session is not scoped to this event.")
    volunteer = db.query(Volunteer).filter(
        Volunteer.event_id == event_id,
        Volunteer.user_id == actor.id,
        Volunteer.status == "ACTIVE",
    ).first()
    if not volunteer:
        raise HTTPException(status_code=403, detail="No active volunteer assignment exists for this event.")
    return volunteer


def _task_response(task: VolunteerTask) -> dict[str, Any]:
    return {
        "id": task.id,
        "eventId": task.event_id,
        "volunteerId": task.volunteer_id,
        "title": task.title,
        "description": task.description,
        "zone": task.zone,
        "status": (task.status or "PENDING").upper(),
        "dueTime": task.due_time.isoformat() if task.due_time else None,
    }


@router.get("/mine")
def my_volunteer_workspace(
    eventId: str,
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    """Return the authenticated volunteer's own assignment and tasks."""
    event = db.query(Event).filter(Event.id == eventId).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    volunteer = _require_volunteer_assignment(db, actor, eventId)
    tasks = (
        db.query(VolunteerTask)
        .filter(
            VolunteerTask.event_id == eventId,
            VolunteerTask.volunteer_id == volunteer.id,
        )
        .order_by(VolunteerTask.due_time.asc(), VolunteerTask.id.asc())
        .all()
    )
    return {
        "eventId": event.id,
        "eventName": event.name,
        "volunteer": {
            "id": volunteer.id,
            "name": volunteer.name,
            "role": volunteer.role,
            "zone": volunteer.zone,
            "status": volunteer.status,
        },
        "tasks": [_task_response(task) for task in tasks],
    }


@router.patch("/tasks/{task_id}/status")
def update_my_task_status(
    task_id: str,
    payload: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    """Advance an assigned task through allowed volunteer status transitions."""
    event_id = getattr(actor, "active_event_id", None)
    if not event_id:
        raise HTTPException(status_code=403, detail="An event-scoped volunteer session is required.")
    volunteer = _require_volunteer_assignment(db, actor, event_id)
    target_status = str(payload.get("status", "")).strip().upper()
    if target_status not in {"ACCEPTED", "IN_PROGRESS", "COMPLETED"}:
        raise HTTPException(status_code=422, detail="Status must be ACCEPTED, IN_PROGRESS, or COMPLETED.")

    task = db.query(VolunteerTask).filter(
        VolunteerTask.id == task_id,
        VolunteerTask.event_id == event_id,
        VolunteerTask.volunteer_id == volunteer.id,
    ).with_for_update().first()
    if not task:
        raise HTTPException(status_code=404, detail="Assigned task not found.")

    old_status = (task.status or "PENDING").upper()
    if target_status not in _TRANSITIONS.get(old_status, set()):
        raise HTTPException(
            status_code=409,
            detail=f"Task cannot transition from {old_status} to {target_status}. Refresh the task list and try again.",
        )

    event = db.query(Event).filter(Event.id == event_id).first()
    task.status = target_status
    db.add(AuditLog(
        organization_id=event.organization_id if event else None,
        event_id=event_id,
        user_id=actor.id,
        user_role="VOLUNTEER",
        action="VOLUNTEER_TASK_STATUS_CHANGED",
        resource_type="VolunteerTask",
        resource_id=task.id,
        metadata_json={"from": old_status, "to": target_status},
    ))
    db.commit()
    db.refresh(task)
    return _task_response(task)
