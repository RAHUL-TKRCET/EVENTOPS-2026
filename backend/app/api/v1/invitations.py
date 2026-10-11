from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import uuid
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.events import _active_role, _is_platform_admin, require_event_scope
from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.entities import (
    AuditLog,
    Event,
    EventMember,
    Invitation,
    Judge,
    Organization,
    User,
)

router = APIRouter()
INVITABLE_ROLES = {
    "EVENT_ADMIN",
    "COORDINATOR",
    "JUDGE",
    "VOLUNTEER",
    "PARTICIPANT",
    "TECHNICAL_STAFF",
    "RESOURCE_MANAGER",
}
INVITATION_LIFETIME = timedelta(days=7)


class InvitationCreate(BaseModel):
    email: EmailStr
    role: Literal[
        "EVENT_ADMIN",
        "COORDINATOR",
        "JUDGE",
        "VOLUNTEER",
        "PARTICIPANT",
        "TECHNICAL_STAFF",
        "RESOURCE_MANAGER",
    ]
    eventId: str = Field(min_length=1, max_length=64)


class InvitationSummary(BaseModel):
    id: str
    email: str
    role: str
    organizationId: str
    eventId: str
    status: str
    createdAt: str
    expiresAt: str


class InvitationCreated(InvitationSummary):
    token: str
    acceptanceUrl: Optional[str] = None
    emailDelivery: Literal["NOT_CONFIGURED"] = "NOT_CONFIGURED"


class InvitationVerifyRequest(BaseModel):
    token: str = Field(min_length=20, max_length=512)


class InvitationVerifyResponse(BaseModel):
    valid: bool
    message: str
    email: Optional[str] = None
    role: Optional[str] = None
    organizationName: Optional[str] = None
    eventName: Optional[str] = None
    expiresAt: Optional[str] = None


class InvitationAcceptRequest(BaseModel):
    token: str = Field(min_length=20, max_length=512)
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)


class InvitationAccepted(BaseModel):
    message: str
    userId: str
    eventId: str
    role: str
    accountCreated: bool


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(value: datetime) -> datetime:
    # SQLite may return naive datetime objects for timezone-aware columns.
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _audit(
    db: Session,
    actor: User | None,
    action: str,
    invitation: Invitation,
    metadata: dict | None = None,
) -> None:
    db.add(AuditLog(
        id=f"audit-{uuid.uuid4().hex[:16]}",
        organization_id=invitation.organization_id,
        event_id=invitation.event_id,
        user_id=actor.id if actor else None,
        user_role=_active_role(actor) if actor else None,
        action=action,
        resource_type="INVITATION",
        resource_id=invitation.id,
        metadata_json=metadata or {},
    ))


def _load_scoped_event(db: Session, event_id: str, actor: User) -> Event:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    require_event_scope(event, actor)
    role = _active_role(actor)
    if role not in {"ORGANIZATION_ADMIN", "EVENT_ADMIN", "SUPER_ADMIN"}:
        raise HTTPException(status_code=403, detail="This role cannot manage invitations.")
    return event


def _can_view_invitation(actor: User, invitation: Invitation, event: Event) -> None:
    require_event_scope(event, actor)
    if _active_role(actor) not in {"ORGANIZATION_ADMIN", "EVENT_ADMIN", "SUPER_ADMIN"}:
        raise HTTPException(status_code=403, detail="This role cannot manage invitations.")


def _summary(invitation: Invitation) -> InvitationSummary:
    return InvitationSummary(
        id=invitation.id,
        email=invitation.email,
        role=invitation.role,
        organizationId=invitation.organization_id,
        eventId=invitation.event_id,
        status=invitation.status,
        createdAt=_aware(invitation.created_at).isoformat(),
        expiresAt=_aware(invitation.expires_at).isoformat(),
    )


def _pending_invitation(db: Session, token: str, for_update: bool = False) -> Invitation:
    query = db.query(Invitation).filter(Invitation.token_hash == _token_hash(token))
    if for_update:
        query = query.with_for_update()
    invitation = query.first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation is invalid or unavailable.")
    if invitation.status != "PENDING":
        raise HTTPException(status_code=410, detail="This invitation is no longer pending.")
    if _aware(invitation.expires_at) <= _now():
        invitation.status = "EXPIRED"
        db.commit()
        raise HTTPException(status_code=410, detail="This invitation has expired.")
    return invitation


@router.post("", response_model=InvitationCreated, status_code=status.HTTP_201_CREATED)
def create_invitation(
    payload: InvitationCreate,
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    event = _load_scoped_event(db, payload.eventId, actor)
    if not event.organization_id:
        raise HTTPException(status_code=422, detail="Invitations require an organization-owned event.")
    email = str(payload.email).strip().lower()
    existing = db.query(Invitation).filter(
        Invitation.event_id == event.id,
        Invitation.email.ilike(email),
        Invitation.status == "PENDING",
    ).all()
    for pending in existing:
        if _aware(pending.expires_at) > _now():
            raise HTTPException(status_code=409, detail="A pending invitation already exists for this email and event.")
        pending.status = "EXPIRED"

    token = secrets.token_urlsafe(32)
    invitation = Invitation(
        id=f"inv-{uuid.uuid4().hex[:16]}",
        email=email,
        role=payload.role,
        organization_id=event.organization_id,
        event_id=event.id,
        invited_by=actor.id,
        token_hash=_token_hash(token),
        status="PENDING",
        expires_at=_now() + INVITATION_LIFETIME,
    )
    db.add(invitation)
    _audit(db, actor, "INVITATION_CREATED", invitation, {"role": invitation.role})
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Invitation could not be created because of a conflicting record.") from exc
    db.refresh(invitation)
    # Email delivery is deliberately not claimed. UI can copy the returned token/link.
    # The shared invitation UI route has not shipped; return no misleading URL.
    return InvitationCreated(**_summary(invitation).model_dump(), token=token, acceptanceUrl=None)


@router.get("", response_model=list[InvitationSummary])
def list_invitations(
    eventId: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    role = _active_role(actor)
    query = db.query(Invitation)
    if _is_platform_admin(actor):
        if eventId:
            event = _load_scoped_event(db, eventId, actor)
            query = query.filter(Invitation.event_id == event.id)
    elif getattr(actor, "active_event_id", None):
        active_event_id = getattr(actor, "active_event_id", None)
        if eventId and eventId != active_event_id:
            raise HTTPException(status_code=403, detail="Cross-event invitation access denied.")
        if role not in {"EVENT_ADMIN", "ORGANIZATION_ADMIN"}:
            raise HTTPException(status_code=403, detail="This role cannot view invitations.")
        query = query.filter(Invitation.event_id == active_event_id)
    elif role == "ORGANIZATION_ADMIN":
        organization_id = getattr(actor, "active_organization_id", None) or actor.organization_id
        if not organization_id:
            raise HTTPException(status_code=403, detail="An organization context is required.")
        if eventId:
            event = _load_scoped_event(db, eventId, actor)
            query = query.filter(Invitation.event_id == event.id)
        else:
            query = query.filter(Invitation.organization_id == organization_id)
    elif role == "EVENT_ADMIN":
        raise HTTPException(status_code=403, detail="Event-scoped access is required to list invitations.")
    else:
        raise HTTPException(status_code=403, detail="This role cannot view invitations.")
    return [_summary(item) for item in query.order_by(Invitation.created_at.desc()).limit(500).all()]


@router.post("/verify", response_model=InvitationVerifyResponse)
def verify_invitation(payload: InvitationVerifyRequest, db: Session = Depends(get_db)):
    try:
        invitation = _pending_invitation(db, payload.token)
    except HTTPException as exc:
        return InvitationVerifyResponse(valid=False, message=str(exc.detail))
    organization = db.query(Organization).filter(Organization.id == invitation.organization_id).first()
    event = db.query(Event).filter(Event.id == invitation.event_id).first()
    if not organization or not event or event.organization_id != invitation.organization_id:
        return InvitationVerifyResponse(valid=False, message="Invitation scope is no longer valid.")
    return InvitationVerifyResponse(
        valid=True,
        message="Invitation is valid. Complete acceptance to activate your event access.",
        email=invitation.email,
        role=invitation.role,
        organizationName=organization.name,
        eventName=event.name,
        expiresAt=_aware(invitation.expires_at).isoformat(),
    )


@router.post("/accept", response_model=InvitationAccepted)
def accept_invitation(
    payload: InvitationAcceptRequest,
    db: Session = Depends(get_db),
):
    invitation = _pending_invitation(db, payload.token, for_update=True)
    event = db.query(Event).filter(Event.id == invitation.event_id).with_for_update().first()
    if not event or event.organization_id != invitation.organization_id or invitation.role not in INVITABLE_ROLES:
        db.rollback()
        raise HTTPException(status_code=410, detail="Invitation scope is no longer valid.")

    email = invitation.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(email)).with_for_update().first()
    account_created = False
    if user is None:
        if not payload.password:
            raise HTTPException(status_code=422, detail="A password of at least 8 characters is required to create an account.")
        if not payload.name or len(payload.name.strip()) < 2:
            raise HTTPException(status_code=422, detail="A name of at least 2 characters is required to create an account.")
        user = User(
            id=f"usr-{uuid.uuid4().hex[:12]}",
            name=payload.name.strip(),
            email=email,
            password_hash=get_password_hash(payload.password),
            role=invitation.role,
            organization_id=invitation.organization_id,
        )
        db.add(user)
        db.flush()
        account_created = True
    elif user.role == "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Platform administrator accounts cannot accept event-role invitations.")

    existing_member = db.query(EventMember).filter(
        EventMember.event_id == invitation.event_id,
        EventMember.user_id == user.id,
        EventMember.role == invitation.role,
    ).first()
    if existing_member:
        if existing_member.status == "ACTIVE":
            invitation.status = "ACCEPTED"
            invitation.accepted_at = _now()
            _audit(db, user, "INVITATION_ACCEPTED_ALREADY_ASSIGNED", invitation, {"role": invitation.role})
            db.commit()
            return InvitationAccepted(message="This account already has the invited event assignment.", userId=user.id, eventId=invitation.event_id, role=invitation.role, accountCreated=account_created)
        existing_member.status = "ACTIVE"
        existing_member.email = email
    else:
        db.add(EventMember(
            id=f"em-{uuid.uuid4().hex[:16]}",
            event_id=invitation.event_id,
            user_id=user.id,
            name=user.name,
            email=email,
            role=invitation.role,
            status="ACTIVE",
            added_by=invitation.invited_by,
        ))

    if invitation.role == "JUDGE":
        judge = db.query(Judge).filter(
            Judge.event_id == invitation.event_id,
            Judge.email.ilike(email),
        ).first()
        if judge:
            judge.user_id = user.id

    invitation.status = "ACCEPTED"
    invitation.accepted_at = _now()
    _audit(db, user, "INVITATION_ACCEPTED", invitation, {"role": invitation.role, "accountCreated": account_created})
    db.commit()
    return InvitationAccepted(
        message="Invitation accepted. The event assignment is active.",
        userId=user.id,
        eventId=invitation.event_id,
        role=invitation.role,
        accountCreated=account_created,
    )


@router.post("/{invitation_id}/revoke", response_model=InvitationSummary)
def revoke_invitation(
    invitation_id: str,
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    invitation = db.query(Invitation).filter(Invitation.id == invitation_id).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    event = db.query(Event).filter(Event.id == invitation.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    _can_view_invitation(actor, invitation, event)
    if invitation.status != "PENDING":
        raise HTTPException(status_code=409, detail="Only pending invitations can be revoked.")
    invitation.status = "REVOKED"
    invitation.revoked_at = _now()
    _audit(db, actor, "INVITATION_REVOKED", invitation, {"role": invitation.role})
    db.commit()
    db.refresh(invitation)
    return _summary(invitation)
