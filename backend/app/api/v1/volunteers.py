"""Event-scoped volunteer workspace API.

Volunteers can view and advance only tasks assigned to their own volunteer
record in the event bound to their authenticated session.
"""
from datetime import datetime, timezone
import uuid
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.events import _active_role, require_event_scope
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



_MANAGER_ROLES = {"SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR"}


def _require_task_manager(db: Session, actor: User, event_id: str) -> Event:
    role = _active_role(actor)
    if role not in _MANAGER_ROLES:
        raise HTTPException(status_code=403, detail="Only an event administrator or coordinator can manage volunteer tasks.")
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    # COORDINATOR must have an event-scoped session; org/platform admins are
    # additionally constrained by the shared event authorization helper.
    if role == "COORDINATOR" and getattr(actor, "active_event_id", None) != event_id:
        raise HTTPException(status_code=403, detail="The coordinator session is not scoped to this event.")
    from app.api.v1.events import require_event_scope
    require_event_scope(event, actor)
    return event



@router.get("")
def list_event_volunteers(
    eventId: str,
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    """List active volunteers for authorized task assignment in one event."""
    _require_task_manager(db, actor, eventId)
    rows = db.query(Volunteer).filter(
        Volunteer.event_id == eventId,
        Volunteer.status == "ACTIVE",
    ).order_by(Volunteer.name.asc()).all()
    return [
        {
            "id": row.id,
            "eventId": row.event_id,
            "userId": row.user_id,
            "name": row.name,
            "email": row.email,
            "role": row.role,
            "zone": row.zone,
            "status": row.status,
        }
        for row in rows
    ]


@router.get("/tasks")
def list_event_volunteer_tasks(
    eventId: str,
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    """List persisted tasks for an event's authorized operations workspace."""
    _require_task_manager(db, actor, eventId)
    rows = (
        db.query(VolunteerTask)
        .filter(VolunteerTask.event_id == eventId)
        .order_by(VolunteerTask.due_time.asc(), VolunteerTask.id.asc())
        .all()
    )
    volunteers = {
        row.id: row
        for row in db.query(Volunteer).filter(Volunteer.event_id == eventId).all()
    }
    result = []
    for task in rows:
        item = _task_response(task)
        volunteer = volunteers.get(task.volunteer_id) if task.volunteer_id else None
        item["volunteerName"] = volunteer.name if volunteer else None
        item["volunteerRole"] = volunteer.role if volunteer else None
        result.append(item)
    return result


@router.post("/tasks", status_code=201)
def create_event_volunteer_task(
    payload: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    """Create a task in the specified event, optionally assigning a volunteer."""
    event_id = str(payload.get("eventId", "")).strip()
    title = str(payload.get("title", "")).strip()
    if not event_id or not title:
        raise HTTPException(status_code=422, detail="eventId and title are required.")
    if len(title) > 255:
        raise HTTPException(status_code=422, detail="Task title must be 255 characters or fewer.")
    event = _require_task_manager(db, actor, event_id)

    volunteer_id = str(payload.get("volunteerId", "")).strip() or None
    volunteer = None
    if volunteer_id:
        volunteer = db.query(Volunteer).filter(
            Volunteer.id == volunteer_id,
            Volunteer.event_id == event_id,
            Volunteer.status == "ACTIVE",
        ).first()
        if not volunteer:
            raise HTTPException(status_code=422, detail="Choose an active volunteer assigned to this event.")

    due_time = None
    due_raw = payload.get("dueTime")
    if due_raw:
        try:
            due_time = datetime.fromisoformat(str(due_raw).replace("Z", "+00:00"))
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="dueTime must be an ISO-8601 timestamp.") from exc
        if due_time.tzinfo is None:
            due_time = due_time.replace(tzinfo=timezone.utc)

    task = VolunteerTask(
        id=f"tsk-{uuid.uuid4().hex[:12]}",
        event_id=event_id,
        volunteer_id=volunteer_id,
        title=title,
        description=(str(payload.get("description", "")).strip() or None),
        zone=(str(payload.get("zone", "")).strip() or (volunteer.zone if volunteer else None)),
        status="ASSIGNED" if volunteer else "PENDING",
        due_time=due_time,
    )
    db.add(task)
    db.add(AuditLog(
        organization_id=event.organization_id,
        event_id=event_id,
        user_id=actor.id,
        user_role=_active_role(actor),
        action="VOLUNTEER_TASK_CREATED",
        resource_type="VolunteerTask",
        resource_id=task.id,
        metadata_json={"volunteerId": volunteer_id, "status": task.status},
    ))
    db.commit()
    db.refresh(task)
    item = _task_response(task)
    item["volunteerName"] = volunteer.name if volunteer else None
    item["volunteerRole"] = volunteer.role if volunteer else None
    return item


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
