import uuid
import hashlib
from datetime import datetime, timedelta, timezone
import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.config import settings
from app.core.database import get_db
from app.core.email import EmailDeliveryError, send_participant_credentials
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.models.entities import User, OrganizationMembership, Organization, Event, EventMember, AuditLog
from app.schemas.auth import LoginRequest, EventLoginRequest, RegisterRequest, TokenResponse, UserResponse, RoleSwitchRequest, RoleSwitchResponse, VerifyInviteRequest, VerifyInviteResponse, EventRegistrationRequest, EventRegistrationStatusResponse, EventRegistrationResult, EventRegistrationSummary, ProfileUpdateRequest, PublicEventRegistrationRequest, PublicEventRegistrationResponse
from app.schemas.errors import PUBLIC_REGISTRATION_ERROR_CODES
from app.api.deps import get_current_user, require_roles

router = APIRouter()


def _public_registration_error(code: str, message: str | None = None) -> dict[str, str]:
    """Return a stable machine-readable code and safe user-facing message."""
    return {"code": code, "message": message or PUBLIC_REGISTRATION_ERROR_CODES[code]}


def _token_response(user: User, role: str, organization_id: str | None, event_id: str | None = None) -> TokenResponse:
    claims = {"email": user.email, "role": role, "organizationId": organization_id, "name": user.name}
    if event_id:
        claims["eventId"] = event_id
    access_token = create_access_token(subject=user.id, claims=claims)
    refresh_token = create_refresh_token(subject=user.id)
    return TokenResponse(
        user=UserResponse(id=user.id, name=user.name, email=user.email, role=role, organizationId=organization_id, createdAt=user.created_at.isoformat() if user.created_at else None),
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


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a participant or atomically create a new organization and its owner."""
    email = str(payload.email).strip().lower()
    if db.query(User).filter(User.email.ilike(email)).first():
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    if payload.role == "ORGANIZATION_ADMIN":
        if not payload.organizationName or not payload.organizationName.strip():
            raise HTTPException(status_code=422, detail="Organization name is required for organization admin registration.")
        organization = Organization(
            id=f"org-{uuid.uuid4().hex[:12]}",
            name=payload.organizationName.strip(),
        )
        db.add(organization)
        try:
            db.flush()
            user = User(
                id=f"usr-{uuid.uuid4().hex[:12]}",
                name=payload.name.strip(),
                email=email,
                password_hash=get_password_hash(payload.password),
                role="ORGANIZATION_ADMIN",
                organization_id=organization.id,
            )
            db.add(user)
            db.flush()
            db.add(OrganizationMembership(
                id=f"om-{uuid.uuid4().hex[:12]}",
                user_id=user.id,
                organization_id=organization.id,
                role="ORGANIZATION_ADMIN",
                status="ACTIVE",
            ))
            db.commit()
            db.refresh(user)
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=400, detail="An account with this email address already exists.") from exc
        return _token_response(user, user.role, organization.id)

    if payload.role not in (None, "PARTICIPANT"):
        raise HTTPException(status_code=403, detail="Public registration cannot grant staff or platform roles.")
    user = User(
        id=f"usr-{uuid.uuid4().hex[:12]}",
        name=payload.name.strip(),
        email=email,
        password_hash=get_password_hash(payload.password),
        role="PARTICIPANT",
        organization_id=None,
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Registration could not be completed because of a data conflict. Please retry.") from exc
    return _token_response(user, user.role, user.organization_id)


@router.post("/public-event-registration", response_model=PublicEventRegistrationResponse, status_code=status.HTTP_201_CREATED)
def public_event_registration(
    payload: PublicEventRegistrationRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Register a participant without requiring a prior account or login.

    Rate-limit public registration attempts using existing append-only audit rows;
    send temporary credentials only through configured SMTP. If SMTP is not
    available, roll back the new user and membership and never report success.
    """
    email = str(payload.email).strip().lower()
    name = payload.name.strip()
    event = db.query(Event).filter(Event.id == payload.eventId).with_for_update().first()
    if not event:
        raise HTTPException(
            status_code=404,
            detail=_public_registration_error("EVENT_NOT_FOUND"),
        )

    # Do not trust arbitrary X-Forwarded-For headers here; use the address
    # provided by the ASGI server. Hash the email for per-address throttling so
    # attempts are rate-limited without keeping a copy of submitted email data.
    client_ip = request.client.host if request.client else "unknown"
    email_digest = hashlib.sha256(email.encode("utf-8")).hexdigest()
    ip_window = max(1, settings.PUBLIC_REGISTRATION_IP_WINDOW_MINUTES)
    email_window = max(1, settings.PUBLIC_REGISTRATION_EMAIL_WINDOW_MINUTES)
    ip_limit = max(1, settings.PUBLIC_REGISTRATION_IP_LIMIT)
    email_limit = max(1, settings.PUBLIC_REGISTRATION_EMAIL_LIMIT)
    now = datetime.now(timezone.utc)

    ip_cutoff = now - timedelta(minutes=ip_window)
    ip_attempts = db.query(AuditLog).filter(
        AuditLog.action == "PUBLIC_REGISTRATION_ATTEMPT",
        AuditLog.ip_address == client_ip,
        AuditLog.created_at >= ip_cutoff,
    ).count()
    if ip_attempts >= ip_limit:
        raise HTTPException(
            status_code=429,
            detail="Too many registration attempts from this connection. Wait a while before trying again.",
            headers={"Retry-After": str(ip_window * 60)},
        )

    email_cutoff = now - timedelta(minutes=email_window)
    email_attempts = db.query(AuditLog).filter(
        AuditLog.action == "PUBLIC_REGISTRATION_ATTEMPT",
        AuditLog.resource_id == email_digest,
        AuditLog.created_at >= email_cutoff,
    ).count()
    if email_attempts >= email_limit:
        raise HTTPException(
            status_code=429,
            detail="Too many registration attempts were made for these details. Wait a while before trying again.",
            headers={"Retry-After": str(email_window * 60)},
        )

    db.add(AuditLog(
        organization_id=event.organization_id,
        event_id=event.id,
        user_id=None,
        user_role="ANONYMOUS",
        action="PUBLIC_REGISTRATION_ATTEMPT",
        resource_type="PublicEventRegistration",
        resource_id=email_digest,
        ip_address=client_ip,
        metadata_json={"source": "public-event-registration", "emailHash": email_digest},
    ))
    # Persist the attempt separately so provider failures and business-rule
    # rejection do not reset the throttle counter.
    db.commit()

    if (event.status or "").strip().upper() != "PUBLISHED":
        raise HTTPException(
            status_code=409,
            detail=_public_registration_error("EVENT_NOT_PUBLISHED"),
        )

    deadline = event.registration_deadline
    if deadline and deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    if not deadline:
        raise HTTPException(
            status_code=409,
            detail=_public_registration_error("REGISTRATION_DEADLINE_UNAVAILABLE"),
        )
    if deadline <= now:
        raise HTTPException(
            status_code=409,
            detail=_public_registration_error("REGISTRATION_CLOSED"),
        )

    existing_user = db.query(User).filter(User.email.ilike(email)).first()
    if existing_user:
        # Do not silently take over an identity or rotate credentials based only
        # on a user-submitted email address. This also avoids role downgrades.
        raise HTTPException(
            status_code=409,
            detail=_public_registration_error("PARTICIPANT_ACCOUNT_EXISTS"),
        )

    existing_member = db.query(EventMember).filter(
        EventMember.event_id == event.id,
        EventMember.email.ilike(email),
        EventMember.role == "PARTICIPANT",
    ).first()
    if existing_member:
        raise HTTPException(
            status_code=409,
            detail=_public_registration_error("PARTICIPANT_ALREADY_REGISTERED"),
        )

    temporary_password = secrets.token_urlsafe(15)
    user = User(
        id=f"usr-{uuid.uuid4().hex[:12]}",
        name=name,
        email=email,
        password_hash=get_password_hash(temporary_password),
        phone=payload.phone.strip() if payload.phone else None,
        role="PARTICIPANT",
        organization_id=None,
    )
    member = EventMember(
        id=f"mem-{uuid.uuid4().hex[:12]}",
        event_id=event.id,
        user_id=user.id,
        name=name,
        email=email,
        role="PARTICIPANT",
        phone=payload.phone.strip() if payload.phone else None,
        zone_or_dept=payload.organizationOrSchool.strip() if payload.organizationOrSchool else None,
        status="ACTIVE",
        added_by=None,
    )

    db.add(user)
    db.add(member)
    try:
        db.flush()
        send_participant_credentials(email, name, email, temporary_password, event.name, event.id)
        db.add(AuditLog(
            organization_id=event.organization_id,
            event_id=event.id,
            user_id=user.id,
            user_role="PARTICIPANT",
            action="PUBLIC_PARTICIPANT_REGISTERED",
            resource_type="EventMember",
            resource_id=member.id,
            metadata_json={"source": "public-event-registration", "emailDelivery": "accepted"},
        ))
        db.commit()
        db.refresh(member)
    except EmailDeliveryError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail=_public_registration_error("EMAIL_DELIVERY_UNAVAILABLE"),
        ) from exc
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=_public_registration_error("REGISTRATION_CONFLICT"),
        ) from exc
    except Exception:
        db.rollback()
        raise

    return PublicEventRegistrationResponse(
        eventId=event.id,
        eventName=event.name,
        registrationId=member.id,
        status=member.status or "ACTIVE",
        createdAt=member.created_at.isoformat() if member.created_at else None,
        emailStatus="sent",
        message="Registration completed. Login details were accepted by the configured email provider.",
    )
