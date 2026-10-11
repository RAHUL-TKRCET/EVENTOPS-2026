from typing import Optional, Set

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.entities import Event, EventMember, OrganizationMembership, User


def ensure_event_access(
    event: Event,
    user: User,
    db: Session,
    required_roles: Optional[Set[str]] = None,
) -> None:
    """Authorize access to one event from persisted org/event assignments.

    The effective role and event scope are populated by get_current_user after
    token validation. This helper independently verifies the relationship to
    the requested event before allowing object access or mutation.
    """
    active_role = getattr(user, "active_role", user.role)
    active_event_id = getattr(user, "active_event_id", None)

    if active_role == "SUPER_ADMIN" and not active_event_id:
        return

    if active_event_id and active_event_id != event.id:
        raise HTTPException(status_code=403, detail="This session is not assigned to the requested event.")

    if active_role == "ORGANIZATION_ADMIN":
        membership = (
            db.query(OrganizationMembership)
            .filter(
                OrganizationMembership.user_id == user.id,
                OrganizationMembership.organization_id == event.organization_id,
                OrganizationMembership.role == "ORGANIZATION_ADMIN",
                OrganizationMembership.status == "ACTIVE",
            )
            .first()
        )
        if membership:
            if required_roles and active_role not in required_roles:
                raise HTTPException(status_code=403, detail="This role cannot perform the requested event action.")
            return

    if active_role == "EVENT_ADMIN" and event.owner_id == user.id:
        if required_roles and active_role not in required_roles:
            raise HTTPException(status_code=403, detail="This role cannot perform the requested event action.")
        return

    assignment = (
        db.query(EventMember)
        .filter(
            EventMember.event_id == event.id,
            EventMember.user_id == user.id,
            EventMember.role == active_role,
            EventMember.status == "ACTIVE",
        )
        .first()
    )
    if assignment:
        if required_roles and active_role not in required_roles:
            raise HTTPException(status_code=403, detail="This role cannot perform the requested event action.")
        return

    if event.owner_id == user.id and not required_roles:
        return

    raise HTTPException(status_code=403, detail="No active membership grants access to this event.")


def get_event_or_404(event_id: str, db: Session) -> Event:
    """Return an event by id or raise a 404 without disclosing other data."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    return event
