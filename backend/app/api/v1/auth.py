import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
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

    if payload.role and user.role != payload.role and user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Unauthorized: Account role is '{user.role}', but login requested '{payload.role}'.",
        )

    effective_role = payload.role if (payload.role and user.role == "SUPER_ADMIN") else user.role

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
        expiresIn=86400,
    )


@router.post("/event-login", response_model=TokenResponse)
def event_login(payload: EventLoginRequest, db: Session = Depends(get_db)):
    """Authenticate member scoped to a specific event."""
    # Check if registered user exists
    user = db.query(User).filter(User.email.ilike(payload.email)).first()
    if user and verify_password(payload.password, user.password_hash):
        pass
    else:
        # Check event_members roster
        member = (
            db.query(EventMember)
            .filter(
                EventMember.event_id == payload.eventId,
                EventMember.email.ilike(payload.email),
                EventMember.role == payload.role,
            )
            .first()
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"No verified {payload.role} assignment found for email '{payload.email}' in event '{payload.eventId}'.",
            )
        # Check or create shadow user for member
        user = db.query(User).filter(User.email.ilike(payload.email)).first()
        if not user:
            user = User(
                id=f"usr-{uuid.uuid4().hex[:8]}",
                name=member.name,
                email=member.email,
                password_hash=get_password_hash(payload.password),
                role=payload.role,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    claims = {
        "email": user.email,
        "role": payload.role,
        "eventId": payload.eventId,
        "name": user.name,
    }
    access_token = create_access_token(subject=user.id, claims=claims)
    refresh_token = create_refresh_token(subject=user.id)

    user_resp = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=payload.role,
        organizationId=user.organization_id,
        createdAt=user.created_at.isoformat() if user.created_at else None,
    )

    return TokenResponse(
        user=user_resp,
        token=access_token,
        accessToken=access_token,
        refreshToken=refresh_token,
        expiresIn=86400,
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

    new_user = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        name=payload.name,
        email=payload.email.lower(),
        password_hash=get_password_hash(payload.password),
        role=payload.role or "PARTICIPANT",
        organization_id=payload.organizationId,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

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
        expiresIn=86400,
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
):
    """Dynamic role elevation/switch strictly limited to SUPER_ADMIN."""
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SUPER_ADMIN platform accounts are permitted to dynamically switch roles.",
        )

    claims = {
        "email": current_user.email,
        "role": payload.targetRole,
        "organizationId": current_user.organization_id,
        "name": current_user.name,
    }
    access_token = create_access_token(subject=current_user.id, claims=claims)
    refresh_token = create_refresh_token(subject=current_user.id)

    return RoleSwitchResponse(
        message=f"Successfully switched active session role to {payload.targetRole}",
        role=payload.targetRole,
        token=access_token,
        accessToken=access_token,
        refreshToken=refresh_token,
        expiresIn=86400,
    )


@router.post("/verify-invite", response_model=VerifyInviteResponse)
def verify_invite(payload: VerifyInviteRequest, db: Session = Depends(get_db)):
    """Validate organization invitation token and return pre-assigned role."""
    code = payload.inviteCode.strip().upper()
    role_map = {
        "INV-JURY-2026": ("JUDGE", "org-01", "Nexus Tech University"),
        "INV-VOL-2026": ("VOLUNTEER", "org-01", "Nexus Tech University"),
        "INV-COORD-2026": ("COORDINATOR", "org-01", "Nexus Tech University"),
        "INV-ADMIN-2026": ("ORGANIZATION_ADMIN", "org-01", "Nexus Tech University"),
    }

    if code in role_map:
        target_role, org_id, org_name = role_map[code]
        return VerifyInviteResponse(
            valid=True,
            role=target_role,
            organizationId=org_id,
            organizationName=org_name,
            message=f"Verified invitation for {target_role} role at {org_name}.",
        )

    return VerifyInviteResponse(
        valid=False,
        message="Invalid or expired invitation token.",
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

