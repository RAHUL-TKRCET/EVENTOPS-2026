import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)
from app.models.entities import (
    Event,
    EventInvitation,
    EventMember,
    Organization,
    OrganizationMembership,
    User,
)
from app.schemas.auth import (
    EventInvitationCreateRequest,
    EventInvitationCreateResponse,
    EventInvitationRedeemRequest,
    EventLoginRequest,
    LoginRequest,
    RegisterRequest,
    RoleSwitchRequest,
    RoleSwitchResponse,
    TokenResponse,
    UserResponse,
    VerifyInviteRequest,
    VerifyInviteResponse,
)
from app.api.deps import get_current_user, require_roles
from app.api.event_access import ensure_event_access, get_event_or_404

router = APIRouter()


def _token_response(user: User, role: str, organization_id: str | None, event_id: str | None = None) -> TokenResponse:
    claims = {
        "email": user.email,
        "role": role,
        "organizationId": organization_id,
        "name": user.name,
    }
    if event_id:
        claims["eventId"] = event_id
    access_token = create_access_token(subject=user.id, claims=claims)
    refresh_token = create_refresh_token(subject=user.id)
    return TokenResponse(
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=role,
            organizationId=organization_id,
            createdAt=user.created_at.isoformat() if user.created_at else None,
        ),
        token=access_token,
        accessToken=access_token,
        refreshToken=refresh_token,
        expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate using the persisted account role; scoped roles use event login."""
    normalized_email = str(payload.email).strip().lower()
    user = db.query(User).filter(User.email.ilike(normalized_email)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Invalid email or password.",
        )

    # A platform Super Admin must not be able to mint arbitrary event/tenant
    # contexts through the ordinary login endpoint.
    if payload.role and payload.role != user.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requested role does not match this account. Use an event invitation or administrator-provisioned assignment.",
        )

    if user.role == "ORGANIZATION_ADMIN":
        membership = db.query(OrganizationMembership).filter(
            OrganizationMembership.user_id == user.id,
            OrganizationMembership.organization_id == user.organization_id,
            OrganizationMembership.role == "ORGANIZATION_ADMIN",
            OrganizationMembership.status == "ACTIVE",
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No active organization-owner membership is associated with this account.",
            )

    return _token_response(user, user.role, user.organization_id)


@router.post("/event-login", response_model=TokenResponse)
def event_login(payload: EventLoginRequest, db: Session = Depends(get_db)):
    """Authenticate an existing account only when it has an active assignment to this event and role."""
    normalized_email = str(payload.email).strip().lower()
    user = db.query(User).filter(User.email.ilike(normalized_email)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Invalid email or password.",
        )

    member = db.query(EventMember).filter(
        EventMember.event_id == payload.eventId,
        EventMember.email.ilike(normalized_email),
        EventMember.role == payload.role,
        EventMember.status == "ACTIVE",
        EventMember.user_id == user.id,
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active event assignment linked to this account was found for the requested role.",
        )

    event = db.query(Event).filter(Event.id == payload.eventId).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    # Event-scoped tokens use the event's actual tenant rather than a client value.
    return _token_response(user, member.role, event.organization_id, event.id)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a participant, or atomically create an organization and its owner."""
    normalized_email = str(payload.email).strip().lower()
    existing = db.query(User).filter(User.email.ilike(normalized_email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    requested_role = payload.role or "PARTICIPANT"
    if requested_role not in {"PARTICIPANT", "ORGANIZATION_ADMIN"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This role cannot be self-assigned during public registration. Use an event invitation or an administrator-provisioned account.",
        )

    organization_name = (payload.organizationName or "").strip()
    if requested_role == "ORGANIZATION_ADMIN":
        if len(organization_name) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="organizationName is required when creating an organization administrator account.",
            )
        if payload.organizationId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Public organization registration must create a new organization; an existing organization cannot be selected.",
            )
    elif payload.organizationId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An organization cannot be selected directly during public participant registration. Use the relevant event invitation or joining flow.",
        )

    user_id = f"usr-{uuid.uuid4().hex[:12]}"
    organization_id = None
    new_user = User(
        id=user_id,
        name=payload.name.strip(),
        email=normalized_email,
        password_hash=get_password_hash(payload.password),
        role=requested_role,
        organization_id=None,
    )

    try:
        if requested_role == "ORGANIZATION_ADMIN":
            organization = Organization(
                id=f"org-{uuid.uuid4().hex[:12]}",
                name=organization_name,
                type="Organization",
                country="Not specified",
                city="Not specified",
                owner_id=user_id,
                contact_email=normalized_email,
                plan="Starter",
            )
            db.add(organization)
            db.flush()
            organization_id = organization.id
            new_user.organization_id = organization_id

        db.add(new_user)
        db.flush()

        if organization_id:
            db.add(OrganizationMembership(
                user_id=new_user.id,
                organization_id=organization_id,
                role="ORGANIZATION_ADMIN",
                status="ACTIVE",
            ))

        # Validate token creation before committing, but keep all three rows in
        # the same transaction to prevent orphan organizations or users.
        response = _token_response(new_user, requested_role, organization_id)
        db.commit()
        db.refresh(new_user)
    except IntegrityError as exc:
        db.rollback()
        existing = db.query(User).filter(User.email.ilike(normalized_email)).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Registration could not be completed because of a data conflict. Please try again.",
        ) from exc
    except Exception:
        db.rollback()
        raise

    response.user.createdAt = new_user.created_at.isoformat() if new_user.created_at else None
    return response


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Return profile of authenticated caller."""
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        organizationId=current_user.organization_id,
        createdAt=current_user.created_at.isoformat() if current_user.created_at else None,
    )


@router.post("/switch-role", response_model=RoleSwitchResponse)
def switch_active_role(
    payload: RoleSwitchRequest,
    current_user: User = Depends(get_current_user),
):
    """Only the platform account may request a temporary role context."""
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SUPER_ADMIN platform accounts are permitted to dynamically switch roles.",
        )

    # Avoid granting tenant/event scope here. These claims only change the
    # displayed platform role; scoped event access must be issued by event login.
    if payload.targetRole != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role switching cannot create an event or organization assignment. Use the relevant scoped access workflow.",
        )

    result = _token_response(current_user, "SUPER_ADMIN", None)
    return RoleSwitchResponse(
        message="Platform administrator session renewed.",
        role="SUPER_ADMIN",
        token=result.token,
        accessToken=result.accessToken,
        refreshToken=result.refreshToken,
        expiresIn=result.expiresIn,
    )


@router.post("/verify-invite", response_model=VerifyInviteResponse)
def verify_invite(payload: VerifyInviteRequest, db: Session = Depends(get_db)):
    """Verify only opaque invitation tokens persisted as hashes."""
    token = payload.inviteCode.strip()
    if not token or len(token) > 256:
        return VerifyInviteResponse(valid=False, message="Invalid or expired invitation token.")

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)
    invitation = db.query(EventInvitation).filter(
        EventInvitation.token_hash == token_hash,
        EventInvitation.revoked_at.is_(None),
        EventInvitation.expires_at > now,
        EventInvitation.redeemed_at.is_(None),
    ).first()
    if not invitation:
        return VerifyInviteResponse(valid=False, message="Invalid or expired invitation token.")

    event = db.query(Event).filter(Event.id == invitation.event_id).first()
    organization = db.query(Organization).filter(Organization.id == invitation.organization_id).first()
    if not event or not organization or event.organization_id != organization.id:
        return VerifyInviteResponse(valid=False, message="Invalid or expired invitation token.")

    return VerifyInviteResponse(
        valid=True,
        role=invitation.role,
        organizationId=organization.id,
        organizationName=organization.name,
        message=f"Verified invitation for {invitation.role} at {organization.name}.",
    )


@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _super: User = Depends(require_roles(["SUPER_ADMIN"])),
):
    """Platform-wide user directory queryable only by Super Admins."""
    users = db.query(User).order_by(User.created_at.desc()).limit(100).all()
    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            organizationId=u.organization_id,
            createdAt=u.created_at.isoformat() if u.created_at else None,
        )
        for u in users
    ]


@router.post("/event-invitations", response_model=EventInvitationCreateResponse, status_code=status.HTTP_201_CREATED)
def create_event_invitation(
    payload: EventInvitationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a high-entropy single-use event invitation, storing only its hash."""
    allowed = {"EVENT_ADMIN", "ORGANIZATION_ADMIN", "SUPER_ADMIN"}
    if current_user.role not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to invite event members.")

    event = get_event_or_404(db, payload.eventId)
    ensure_event_access(current_user, event, allowed_roles=allowed)

    raw_token = secrets.token_urlsafe(32)
    expires_at = payload.expiresAt or (datetime.now(timezone.utc) + timedelta(days=7))
    now = datetime.now(timezone.utc)
    if expires_at <= now or expires_at > now + timedelta(days=30):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invitation expiry must be within the next 30 days.")

    invitation = EventInvitation(
        id=f"inv-{uuid.uuid4().hex}",
        event_id=event.id,
        organization_id=event.organization_id,
        role=payload.role,
        token_hash=hashlib.sha256(raw_token.encode("utf-8")).hexdigest(),
        expires_at=expires_at,
        created_by=current_user.id,
    )
    db.add(invitation)
    db.commit()
    return EventInvitationCreateResponse(
        invitationId=invitation.id,
        token=raw_token,
        eventId=event.id,
        role=invitation.role,
        expiresAt=invitation.expires_at,
    )


@router.post("/event-invitations/redeem", status_code=status.HTTP_204_NO_CONTENT)
def redeem_event_invitation(
    payload: EventInvitationRedeemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Redeem an invitation once, with a row lock to serialize concurrent use."""
    token_hash = hashlib.sha256(payload.token.strip().encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)
    invitation = db.execute(
        select(EventInvitation)
        .where(
            EventInvitation.token_hash == token_hash,
            EventInvitation.revoked_at.is_(None),
            EventInvitation.expires_at > now,
            EventInvitation.redeemed_at.is_(None),
        )
        .with_for_update()
    ).scalar_one_or_none()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid, expired, or already-used invitation.")

    if current_user.email.lower() != payload.email.strip().lower():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invitation email does not match the authenticated account.")

    member = db.query(EventMember).filter(
        EventMember.event_id == invitation.event_id,
        EventMember.user_id == current_user.id,
    ).first()
    if member and member.status == "ACTIVE" and member.role == invitation.role:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Account already has this active event assignment.")

    invitation.redeemed_at = now
    member = member or EventMember(
        id=f"mem-{uuid.uuid4().hex[:12]}",
        event_id=invitation.event_id,
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=invitation.role,
        status="ACTIVE",
        added_by=invitation.created_by,
    )
    member.user_id = current_user.id
    member.name = current_user.name
    member.email = current_user.email
    member.role = invitation.role
    member.status = "ACTIVE"
    db.add(member)
    db.commit()
