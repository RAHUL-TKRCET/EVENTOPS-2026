import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.models.entities import User, OrganizationMembership, Organization, Event, EventMember, AuditLog
from app.schemas.auth import LoginRequest, EventLoginRequest, RegisterRequest, ProfileUpdateRequest, TokenResponse, UserResponse, RoleSwitchRequest, RoleSwitchResponse, VerifyInviteRequest, VerifyInviteResponse, EventRegistrationRequest, EventRegistrationStatusResponse, EventRegistrationResult, EventRegistrationSummary
from app.api.deps import get_current_user, require_roles

router = APIRouter()


def _token_response(user: User, role: str, organization_id: str | None, event_id: str | None = None) -> TokenResponse:
    claims = {"email": user.email, "role": role, "organizationId": organization_id, "name": user.name}
    if event_id:
        claims["eventId"] = event_id
    access_token = create_access_token(subject=user.id, claims=claims)
    refresh_token = create_refresh_token(subject=user.id)
    return TokenResponse(
        user=UserResponse(id=user.id, name=user.name, email=user.email, phone=user.phone, role=role, organizationId=organization_id, createdAt=user.created_at.isoformat() if user.created_at else None),
        token=access_token, accessToken=access_token, refreshToken=refresh_token,
        expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate the persisted account role; event roles require an event assignment."""
    email = str(payload.email).strip().lower()
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Authentication failed: Invalid email or password.")
    if payload.role and payload.role != user.role:
        raise HTTPException(status_code=403, detail="Requested role does not match this account. Use the event portal for event-scoped access.")
    if user.role == "ORGANIZATION_ADMIN":
        membership = db.query(OrganizationMembership).filter(
            OrganizationMembership.user_id == user.id,
            OrganizationMembership.organization_id == user.organization_id,
            OrganizationMembership.role == "ORGANIZATION_ADMIN",
            OrganizationMembership.status == "ACTIVE",
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="No active organization-owner membership is associated with this account.")
    return _token_response(user, user.role, user.organization_id)


@router.post("/event-login", response_model=TokenResponse)
def event_login(payload: EventLoginRequest, db: Session = Depends(get_db)):
    """Authenticate only an existing account with an active matching event assignment."""
    email = str(payload.email).strip().lower()
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Authentication failed: Invalid email or password.")
    member = db.query(EventMember).filter(
        EventMember.event_id == payload.eventId,
        EventMember.email.ilike(email),
        EventMember.role == payload.role,
        EventMember.status == "ACTIVE",
        EventMember.user_id == user.id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="No active event assignment linked to this account was found for the requested role.")
    event = db.query(Event).filter(Event.id == payload.eventId).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    return _token_response(user, member.role, event.organization_id, event.id)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=getattr(current_user, "active_role", None) or current_user.role,
        organizationId=getattr(current_user, "active_organization_id", None) or current_user.organization_id,
        createdAt=current_user.created_at.isoformat() if current_user.created_at else None,
    )


@router.patch("/me", response_model=UserResponse)
def update_me(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Persist safe self-service profile fields without allowing role/org changes."""
    email = str(payload.email).strip().lower()
    duplicate = db.query(User).filter(User.email.ilike(email), User.id != current_user.id).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="An account with this email address already exists.")
    current_user.name = payload.name.strip()
    current_user.email = email
    current_user.phone = payload.phone.strip() if payload.phone else None
    try:
        db.add(AuditLog(
            id=f"audit-{uuid.uuid4().hex[:12]}",
            event_id=getattr(current_user, "active_event_id", None),
            user_id=current_user.id,
            user_role=getattr(current_user, "active_role", None) or current_user.role,
            action="PROFILE_UPDATED",
            resource_type="User",
            resource_id=current_user.id,
        ))
        db.commit()
        db.refresh(current_user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Profile could not be updated because the email address is already in use.") from exc
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=getattr(current_user, "active_role", None) or current_user.role,
        organizationId=current_user.organization_id,
        createdAt=current_user.created_at.isoformat() if current_user.created_at else None,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a participant or atomically create a new organization and its owner."""
    email = str(payload.email).strip().lower()
    if db.query(User).filter(User.email.ilike(email)).first():
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")
    role = payload.role or "PARTICIPANT"
    if role not in {"PARTICIPANT", "ORGANIZATION_ADMIN"}:
        raise HTTPException(status_code=403, detail="This role cannot be self-assigned during public registration.")
    organization_name = (payload.organizationName or "").strip()
    if role == "ORGANIZATION_ADMIN":
        if len(organization_name) < 2:
            raise HTTPException(status_code=422, detail="organizationName is required when creating an organization administrator account.")
        if payload.organizationId:
            raise HTTPException(status_code=400, detail="Public organization registration must create a new organization; an existing organization cannot be selected.")
    elif payload.organizationId:
        raise HTTPException(status_code=400, detail="An organization cannot be selected directly during public participant registration.")

    user_id = f"usr-{uuid.uuid4().hex[:12]}"
    organization_id = None
    user = User(id=user_id, name=payload.name.strip(), email=email, password_hash=get_password_hash(payload.password), role=role, organization_id=None)
    try:
        if role == "ORGANIZATION_ADMIN":
            organization = Organization(
                id=f"org-{uuid.uuid4().hex[:12]}", name=organization_name, type="Organization",
                country="Not specified", city="Not specified", owner_id=user_id,
                contact_email=email, plan="Starter",
            )
            db.add(organization)
            db.flush()
            organization_id = organization.id
            user.organization_id = organization_id
        db.add(user)
        db.flush()
        if organization_id:
            db.add(OrganizationMembership(user_id=user.id, organization_id=organization_id, role="ORGANIZATION_ADMIN", status="ACTIVE"))
        response = _token_response(user, role, organization_id)
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        if db.query(User).filter(User.email.ilike(email)).first():
            raise HTTPException(status_code=400, detail="An account with this email address already exists.") from exc
        raise HTTPException(status_code=409, detail="Registration could not be completed because of a data conflict. Please try again.") from exc
    except Exception:
        db.rollback()
        raise
    response.user.createdAt = user.created_at.isoformat() if user.created_at else None
    return response


def _require_participant_scope(user: User, requested_event_id: str | None = None) -> None:
    active_role = getattr(user, "active_role", user.role)
    if active_role != "PARTICIPANT" or user.role != "PARTICIPANT":
        raise HTTPException(status_code=403, detail="Participant registration requires a participant account.")
    active_event_id = getattr(user, "active_event_id", None)
    if active_event_id and requested_event_id and active_event_id != requested_event_id:
        raise HTTPException(status_code=403, detail="This session is scoped to a different event.")


def _registration_member(db: Session, event_id: str, user: User) -> EventMember | None:
    return (
        db.query(EventMember)
        .filter(EventMember.event_id == event_id, EventMember.user_id == user.id, EventMember.role == "PARTICIPANT")
        .order_by(EventMember.created_at.asc()).first()
    )


def _registration_summary(member: EventMember, event: Event) -> EventRegistrationSummary:
    return EventRegistrationSummary(eventId=event.id, eventName=event.name, status=member.status or "ACTIVE", createdAt=member.created_at.isoformat() if member.created_at else None)


@router.get("/event-registrations", response_model=List[EventRegistrationSummary])
def list_my_event_registrations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_participant_scope(current_user)
    query = db.query(EventMember, Event).join(Event, Event.id == EventMember.event_id).filter(EventMember.user_id == current_user.id, EventMember.role == "PARTICIPANT")
    active_event_id = getattr(current_user, "active_event_id", None)
    if active_event_id: query = query.filter(Event.id == active_event_id)
    rows = query.order_by(EventMember.created_at.desc()).all()
    return [_registration_summary(member, event) for member, event in rows]


@router.get("/event-registration/{event_id}", response_model=EventRegistrationStatusResponse)
def get_my_event_registration(event_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_participant_scope(current_user, event_id)
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event: raise HTTPException(status_code=404, detail="Event not found.")
    member = _registration_member(db, event_id, current_user)
    active_member = member is not None and (member.status or "").upper() == "ACTIVE"
    return EventRegistrationStatusResponse(eventId=event.id, eventName=event.name, registered=bool(active_member), registrationId=member.id if member else None, status=member.status if member else None, createdAt=member.created_at.isoformat() if member and member.created_at else None)


@router.post("/event-registration", response_model=EventRegistrationResult, status_code=status.HTTP_201_CREATED)
def register_for_event(payload: EventRegistrationRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _require_participant_scope(current_user, payload.eventId)
    event = db.query(Event).filter(Event.id == payload.eventId).with_for_update().first()
    if not event: raise HTTPException(status_code=404, detail="Event not found.")
    member = _registration_member(db, event.id, current_user)
    if member:
        if (member.status or "").upper() != "ACTIVE": raise HTTPException(status_code=403, detail="This event registration is not active. Contact the event organizer.")
        session = _token_response(current_user, "PARTICIPANT", event.organization_id, event.id)
        return EventRegistrationResult(eventId=event.id, eventName=event.name, registrationId=member.id, status=member.status or "ACTIVE", createdAt=member.created_at.isoformat() if member.created_at else None, session=session)
    unlinked = db.query(EventMember).filter(EventMember.event_id == event.id, EventMember.user_id.is_(None), EventMember.role == "PARTICIPANT", EventMember.email.ilike(current_user.email)).first()
    if unlinked: raise HTTPException(status_code=409, detail="An unlinked participant record already exists for this event. Contact the organizer to verify and link it.")
    now = datetime.now(timezone.utc)
    deadline = event.registration_deadline
    if deadline and deadline.tzinfo is None: deadline = deadline.replace(tzinfo=timezone.utc)
    if (event.status or "").upper() != "PUBLISHED": raise HTTPException(status_code=409, detail="This event is not published for participant registration.")
    if not deadline or deadline <= now: raise HTTPException(status_code=409, detail="The participant registration deadline has passed or is not configured.")
    member = EventMember(id=f"mem-{uuid.uuid4().hex[:12]}", event_id=event.id, user_id=current_user.id, name=current_user.name, email=current_user.email, role="PARTICIPANT", status="ACTIVE", joined_at=now)
    db.add(member)
    db.add(AuditLog(id=f"audit-{uuid.uuid4().hex[:12]}", event_id=event.id, user_id=current_user.id, user_role="PARTICIPANT", action="EVENT_REGISTERED", resource_type="EventMember", resource_id=member.id))
    db.commit()
    session = _token_response(current_user, "PARTICIPANT", event.organization_id, event.id)
    return EventRegistrationResult(eventId=event.id, eventName=event.name, registrationId=member.id, status=member.status, createdAt=member.created_at.isoformat() if member.created_at else None, session=session)
