import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.models.entities import User, OrganizationMembership, Organization, Event, EventMember
from app.schemas.auth import LoginRequest, EventLoginRequest, RegisterRequest, TokenResponse, UserResponse, RoleSwitchRequest, RoleSwitchResponse, VerifyInviteRequest, VerifyInviteResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter()


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


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(id=current_user.id, name=current_user.name, email=current_user.email, role=current_user.role, organizationId=current_user.organization_id, createdAt=current_user.created_at.isoformat() if current_user.created_at else None)


@router.post("/switch-role", response_model=RoleSwitchResponse)
def switch_active_role(payload: RoleSwitchRequest, current_user: User = Depends(get_current_user)):
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Only SUPER_ADMIN platform accounts may use this endpoint.")
    if payload.targetRole != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Role switching cannot create an event or organization assignment. Use the relevant scoped access workflow.")
    result = _token_response(current_user, "SUPER_ADMIN", None)
    return RoleSwitchResponse(message="Platform administrator session renewed.", role="SUPER_ADMIN", token=result.token, accessToken=result.accessToken, refreshToken=result.refreshToken, expiresIn=result.expiresIn)


@router.post("/verify-invite", response_model=VerifyInviteResponse)
def verify_invite(payload: VerifyInviteRequest, db: Session = Depends(get_db)):
    # Legacy shared codes do not prove assignment or possession by a specific user.
    return VerifyInviteResponse(valid=False, message="Legacy invitation codes are disabled. Ask an event administrator for a secure event invitation.")


@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), _super: User = Depends(require_roles(["SUPER_ADMIN"]))):
    users = db.query(User).order_by(User.created_at.desc()).limit(100).all()
    return [UserResponse(id=u.id, name=u.name, email=u.email, role=u.role, organizationId=u.organization_id, createdAt=u.created_at.isoformat() if u.created_at else None) for u in users]
