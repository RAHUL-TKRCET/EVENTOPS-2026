import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.models.entities import User, OrganizationMembership, Organization, EventMember
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
)
from app.api.deps import get_current_user, require_roles

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

    if member.user_id and member.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This event assignment is linked to a different account.",
        )

    if not member.user_id:
        member.user_id = user.id
        db.commit()
        db.refresh(member)

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
    """Register a new user account."""
    existing = db.query(User).filter(User.email.ilike(payload.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Public self-registration cannot choose privileged/event roles or attach
    # itself to an arbitrary organization. Organization ownership and event
    # roles must be granted by a verified provisioning workflow.
    if payload.role not in (None, "PARTICIPANT"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Self-registration creates participant accounts only. Organization and event roles require an authorized invitation.",
        )

    new_user = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        name=payload.name,
        email=payload.email.lower(),
        password_hash=get_password_hash(payload.password),
        role="PARTICIPANT",
        organization_id=None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    claims = {
        "email": new_user.email,
        "role": new_user.role,
        "organizationId": None,
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
        membership = (
            db.query(OrganizationMembership)
            .filter(
                OrganizationMembership.user_id == current_user.id,
                OrganizationMembership.organization_id == current_user.organization_id,
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


@router.post("/verify-invite", response_model=VerifyInviteResponse)
def verify_invite(payload: VerifyInviteRequest, db: Session = Depends(get_db)):
    """Legacy static invite codes are intentionally disabled."""
    return VerifyInviteResponse(
        valid=False,
        message="Legacy invitation codes have been disabled. Use an invitation issued by an authorized event or organization administrator.",
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

