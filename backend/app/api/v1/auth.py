import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.models.entities import User, OrganizationMembership, Organization, Event, EventMember, EventInvitation
from app.schemas.auth import (
    LoginRequest,
    EventLoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    RoleSwitchRequest,
    RoleSwitchResponse,
    VerifyInviteRequest,
    VerifyInviteResponse,
    EventInvitationCreateRequest,
    EventInvitationCreateResponse,
    EventInvitationRedeemRequest,
)
from app.api.deps import get_current_user, require_roles
from app.api.event_access import ensure_event_access, get_event_or_404

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password and return canonical tokens."""
    user = db.query(User).filter(User.email.ilike(payload.email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Invalid email or password.",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Invalid email or password.",
        )

    # The global login endpoint authenticates the account's stored role only.
    # Event roles must be activated through /event-login after validating EventMember.
    if payload.role and user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requested role does not match this account. Use the event portal for event-scoped roles.",
        )

    effective_role = user.role
    claims = {
        "email": user.email,
        "role": effective_role,
        "organizationId": user.organization_id,
        "name": user.name,
    }
    access_token = create_access_token(subject=user.id, claims=claims)
    refresh_token = create_refresh_token(subject=user.id)

    user_resp = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=effective_role,
        organizationId=user.organization_id,
        createdAt=user.created_at.isoformat() if user.created_at else None,
    )

    return TokenResponse(
        user=user_resp,
        token=access_token,
        accessToken=access_token,
        refreshToken=refresh_token,
        expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/event-login", response_model=TokenResponse)
def event_login(payload: EventLoginRequest, db: Session = Depends(get_db)):
    """Authenticate an account only when it has an active assignment to this event and role."""
    user = db.query(User).filter(User.email.ilike(payload.email)).first()

    # An existing account must always prove its password. Never fall through to
    # roster-based account creation after a bad password.
    if user and not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed: Invalid email or password.",
        )

    member = (
        db.query(EventMember)
        .filter(
            EventMember.event_id == payload.eventId,
            EventMember.email.ilike(payload.email),
            EventMember.role == payload.role,
            EventMember.status == "ACTIVE",
        )
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No active assignment for this event and role was found.",
        )

    # Roster rows are not proof of email ownership. Only link an assignment to
    # an account that already authenticated successfully; do not auto-create a
    # password-bearing account from a known roster email.
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This event assignment is not linked to an account yet. Ask an event administrator to complete secure account provisioning.",
        )

    if not member.user_id or member.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This event assignment is not linked to your account. Ask an event administrator to complete secure account provisioning.",
        )

    claims = {
        "email": user.email,
        "role": member.role,
        "eventId": member.event_id,
        "organizationId": user.organization_id,
        "name": user.name,
    }
    access_token = create_access_token(subject=user.id, claims=claims)
    refresh_token = create_refresh_token(subject=user.id)

    user_resp = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=member.role,
        organizationId=user.organization_id,
        createdAt=user.created_at.isoformat() if user.created_at else None,
    )
    return TokenResponse(
        user=user_resp,
        token=access_token,
        accessToken=access_token,
        refreshToken=refresh_token,
        expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Register a participant or create a fresh organization and its initial owner."""
    existing = db.query(User).filter(User.email.ilike(payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    if payload.organizationId:
        raise HTTPException(status_code=403, detail="Public registration cannot attach to an existing organization.")
    if payload.role not in (None, "PARTICIPANT", "ORGANIZATION_ADMIN"):
        raise HTTPException(status_code=403, detail="Self-registration only supports participant or new-organization owner accounts.")

    user_id = f"usr-{uuid.uuid4().hex[:8]}"
    organization_id = None
    target_role = "PARTICIPANT"

    if payload.role == "ORGANIZATION_ADMIN":
        organization_id = f"org-{uuid.uuid4().hex[:8]}"
        organization_name = (payload.organizationName or "").strip()
        if not organization_name:
            raise HTTPException(status_code=400, detail="organizationName is required for organization-owner registration.")
        db.add(Organization(
            id=organization_id,
            name=organization_name,
            type="Organization",
            country="Not specified",
            city="Not specified",
            owner_id=user_id,
            contact_email=payload.email.lower(),
            plan="Starter",
        ))
        target_role = "ORGANIZATION_ADMIN"

    new_user = User(
        id=user_id,
        name=payload.name,
        email=payload.email.lower(),
        password_hash=get_password_hash(payload.password),
        role=target_role,
        organization_id=organization_id,
    )
    db.add(new_user)
    if organization_id:
        db.add(OrganizationMembership(
            id=f"mem-{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            organization_id=organization_id,
            role="ORGANIZATION_ADMIN",
            status="ACTIVE",
        ))

    try:
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Account registration failed. Please retry.")

    claims = {
        "email": new_user.email,
        "role": new_user.role,
        "organizationId": new_user.organization_id,
        "name": new_user.name,
    }
    access_token = create_access_token(subject=new_user.id, claims=claims)
    refresh_token = create_refresh_token(subject=new_user.id)
    return TokenResponse(
        user=UserResponse(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            role=new_user.role,
            organizationId=new_user.organization_id,
            createdAt=new_user.created_at.isoformat() if new_user.created_at else None,
        ),
        token=access_token,
        accessToken=access_token,
        refreshToken=refresh_token,
        expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


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
    db: Session = Depends(get_db),
):
    """Switch only to a role backed by an authoritative organization/event assignment."""
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SUPER_ADMIN platform accounts can request a scoped role.",
        )

    claims = {
        "email": current_user.email,
        "role": payload.targetRole,
        "organizationId": current_user.organization_id,
        "name": current_user.name,
    }

    if payload.targetRole == "SUPER_ADMIN":
        # Staying in the platform role does not grant an event role.
        claims.pop("eventId", None)
    elif payload.targetRole == "ORGANIZATION_ADMIN":
        if not payload.organizationId:
            raise HTTPException(status_code=400, detail="organizationId is required when switching organization scope.")
        membership = (
            db.query(OrganizationMembership)
            .filter(
                OrganizationMembership.user_id == current_user.id,
                OrganizationMembership.organization_id == payload.organizationId,
                OrganizationMembership.role == "ORGANIZATION_ADMIN",
                OrganizationMembership.status == "ACTIVE",
            )
            .first()
        )
        if not membership:
            raise HTTPException(status_code=403, detail="No active organization-admin assignment was found.")
        claims["organizationId"] = membership.organization_id
    else:
        if not payload.eventId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="eventId is required when switching to an event-scoped role.",
            )
        member = (
            db.query(EventMember)
            .filter(
                EventMember.event_id == payload.eventId,
                EventMember.user_id == current_user.id,
                EventMember.role == payload.targetRole,
                EventMember.status == "ACTIVE",
            )
            .first()
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No active assignment exists for the requested event and role.",
            )
        claims["eventId"] = member.event_id

    access_token = create_access_token(subject=current_user.id, claims=claims)
    refresh_token = create_refresh_token(subject=current_user.id)
    return RoleSwitchResponse(
        message=f"Successfully switched active session role to {payload.targetRole}",
        role=payload.targetRole,
        token=access_token,
        accessToken=access_token,
        refreshToken=refresh_token,
        expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/invitations", response_model=EventInvitationCreateResponse, status_code=status.HTTP_201_CREATED)
def create_event_invitation(
    payload: EventInvitationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a high-entropy, one-time event invitation for a permitted role."""
    event = get_event_or_404(payload.eventId, db)
    active_role = getattr(current_user, "active_role", current_user.role)
    event_roles = {
        "EVENT_ADMIN",
        "COORDINATOR",
        "JUDGE",
        "VOLUNTEER",
        "PARTICIPANT",
        "TECHNICAL_STAFF",
        "RESOURCE_MANAGER",
    }
    if payload.role not in event_roles:
        raise HTTPException(status_code=400, detail="Only event-scoped roles can be invited.")
    ensure_event_access(
        event,
        current_user,
        db,
        required_roles={"SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"},
    )
    if payload.role == "EVENT_ADMIN" and active_role not in {"SUPER_ADMIN", "ORGANIZATION_ADMIN"}:
        raise HTTPException(status_code=403, detail="Only platform or organization admins may invite event admins.")

    email = str(payload.email).strip().lower()
    now = datetime.now(timezone.utc)
    existing_active = (
        db.query(EventMember)
        .filter(
            EventMember.event_id == event.id,
            EventMember.email.ilike(email),
            EventMember.role == payload.role,
            EventMember.status == "ACTIVE",
        )
        .first()
    )
    if existing_active:
        raise HTTPException(status_code=409, detail="This email already has an active assignment for the requested role.")

    # Rotate prior unused invitations for the same scope before creating a new
    # capability. The raw token is returned once and only its SHA-256 hash is stored.
    prior = (
        db.query(EventInvitation)
        .filter(
            EventInvitation.event_id == event.id,
            EventInvitation.email.ilike(email),
            EventInvitation.role == payload.role,
            EventInvitation.redeemed_at.is_(None),
            EventInvitation.revoked_at.is_(None),
        )
        .all()
    )
    for old_invitation in prior:
        old_invitation.revoked_at = now
        old_member = db.query(EventMember).filter(EventMember.id == old_invitation.event_member_id).first()
        if old_member and old_member.status == "INVITED":
            old_member.status = "REVOKED"

    raw_token = secrets.token_urlsafe(36)
    invitation_id = f"inv-{uuid.uuid4().hex}"
    member_id = f"em-{uuid.uuid4().hex[:20]}"
    expires_at = now + timedelta(hours=payload.expiresInHours)
    member = EventMember(
        id=member_id,
        event_id=event.id,
        user_id=None,
        name=email,
        email=email,
        role=payload.role,
        status="INVITED",
        added_by=current_user.id,
    )
    invitation = EventInvitation(
        id=invitation_id,
        token_hash=hashlib.sha256(raw_token.encode("utf-8")).hexdigest(),
        event_id=event.id,
        event_member_id=member_id,
        invited_by_user_id=current_user.id,
        email=email,
        role=payload.role,
        expires_at=expires_at,
    )
    db.add(member)
    db.add(invitation)
    db.commit()

    return EventInvitationCreateResponse(
        invitationId=invitation_id,
        eventId=event.id,
        email=email,
        role=payload.role,
        invitationToken=raw_token,
        expiresAt=expires_at.isoformat(),
        message="Invitation created. Copy this token now and deliver it to the invitee over a trusted channel; it will not be shown again.",
    )


@router.post("/event-invitations/redeem", response_model=TokenResponse)
def redeem_event_invitation(
    payload: EventInvitationRedeemRequest,
    db: Session = Depends(get_db),
):
    """Redeem an invitation using the token and password for its bound email."""
    raw_token = payload.invitationToken.strip()
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    invitation = db.query(EventInvitation).filter(EventInvitation.token_hash == token_hash).first()
    now = datetime.now(timezone.utc)
    if not invitation or invitation.redeemed_at is not None or invitation.revoked_at is not None:
        raise HTTPException(status_code=400, detail="Invitation is invalid, revoked, or already used.")
    expiry = invitation.expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if expiry <= now:
        raise HTTPException(status_code=400, detail="Invitation has expired.")

    member = (
        db.query(EventMember)
        .filter(
            EventMember.id == invitation.event_member_id,
            EventMember.event_id == invitation.event_id,
            EventMember.email.ilike(invitation.email),
            EventMember.role == invitation.role,
            EventMember.status == "INVITED",
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=409, detail="The invitation's roster assignment is no longer available.")

    user = db.query(User).filter(User.email.ilike(invitation.email)).first()
    if user:
        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="The password does not match the account bound to this email.")
    else:
        if not payload.name:
            raise HTTPException(status_code=422, detail="Name is required when creating an account from an invitation.")
        user = User(
            id=f"usr-{uuid.uuid4().hex[:16]}",
            name=payload.name.strip(),
            email=invitation.email,
            password_hash=get_password_hash(payload.password),
            role="PARTICIPANT",
            organization_id=None,
        )
        db.add(user)
        db.flush()

    if member.user_id and member.user_id != user.id:
        raise HTTPException(status_code=409, detail="This roster entry is already linked to a different account.")

    event = db.query(Event).filter(Event.id == invitation.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="The invitation's event no longer exists.")

    member.user_id = user.id
    member.status = "ACTIVE"
    invitation.redeemed_at = now
    db.commit()
    db.refresh(user)

    claims = {
        "email": user.email,
        "role": invitation.role,
        "eventId": invitation.event_id,
        "organizationId": event.organization_id,
        "name": user.name,
    }
    access_token = create_access_token(subject=user.id, claims=claims)
    refresh_token = create_refresh_token(subject=user.id)
    return TokenResponse(
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=invitation.role,
            organizationId=user.organization_id,
            createdAt=user.created_at.isoformat() if user.created_at else None,
        ),
        token=access_token,
        accessToken=access_token,
        refreshToken=refresh_token,
        expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/verify-invite", response_model=VerifyInviteResponse)
def verify_invite(payload: VerifyInviteRequest, db: Session = Depends(get_db)):
    """Verify a one-time database-backed event invitation without consuming it."""
    raw_token = payload.inviteCode.strip()
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    invitation = db.query(EventInvitation).filter(EventInvitation.token_hash == token_hash).first()
    now = datetime.now(timezone.utc)
    if not invitation or invitation.redeemed_at is not None or invitation.revoked_at is not None:
        return VerifyInviteResponse(valid=False, message="Invalid, revoked, or already-used invitation.")
    expiry = invitation.expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if expiry <= now:
        return VerifyInviteResponse(valid=False, message="This invitation has expired.")

    event = db.query(Event).filter(Event.id == invitation.event_id).first()
    if not event:
        return VerifyInviteResponse(valid=False, message="The event for this invitation no longer exists.")
    organization = db.query(Organization).filter(Organization.id == event.organization_id).first() if event.organization_id else None
    return VerifyInviteResponse(
        valid=True,
        role=invitation.role,
        organizationId=event.organization_id,
        organizationName=organization.name if organization else None,
        eventId=event.id,
        eventName=event.name,
        message="Valid event invitation. It can be redeemed once before its expiry.",
    )


@router.delete("/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_event_invitation(
    invitation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revoke an unused invitation and its unredeemed roster assignment."""
    invitation = db.query(EventInvitation).filter(EventInvitation.id == invitation_id).first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found.")
    event = get_event_or_404(invitation.event_id, db)
    ensure_event_access(
        event,
        current_user,
        db,
        required_roles={"SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"},
    )
    if invitation.redeemed_at is not None:
        raise HTTPException(status_code=409, detail="A redeemed invitation cannot be revoked; remove the active event assignment instead.")
    invitation.revoked_at = datetime.now(timezone.utc)
    member = db.query(EventMember).filter(EventMember.id == invitation.event_member_id).first()
    if member and member.status == "INVITED":
        member.status = "REVOKED"
    db.commit()
    return None


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

