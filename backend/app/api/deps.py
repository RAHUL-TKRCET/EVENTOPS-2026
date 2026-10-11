from typing import List, Optional
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.entities import User, OrganizationMembership, EventMember

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Validate the access token and re-check any scoped role against the database."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or non-access authentication token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token claims.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with token no longer exists.",
        )

    token_role = payload.get("role", user.role)
    token_event_id = payload.get("eventId")
    token_org_id = payload.get("organizationId")

    # Never trust an event/organization role only because it appears in a JWT.
    # Recheck the assignment on each request so removal/revocation takes effect.
    if token_event_id:
        member = (
            db.query(EventMember)
            .filter(
                EventMember.event_id == token_event_id,
                EventMember.user_id == user.id,
                EventMember.role == token_role,
                EventMember.status == "ACTIVE",
            )
            .first()
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The event-role assignment is missing or no longer active.",
            )
        user.active_role = token_role
        user.active_event_id = token_event_id
        user.active_organization_id = token_org_id or user.organization_id
    elif token_role == "SUPER_ADMIN":
        if user.role != "SUPER_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account is not authorized for the platform administrator role.",
            )
        user.active_role = "SUPER_ADMIN"
        user.active_event_id = None
        user.active_organization_id = None
    elif token_role == "ORGANIZATION_ADMIN":
        membership = (
            db.query(OrganizationMembership)
            .filter(
                OrganizationMembership.user_id == user.id,
                OrganizationMembership.organization_id == token_org_id,
                OrganizationMembership.role == "ORGANIZATION_ADMIN",
                OrganizationMembership.status == "ACTIVE",
            )
            .first()
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The organization-role assignment is missing or no longer active.",
            )
        user.active_role = token_role
        user.active_event_id = None
        user.active_organization_id = membership.organization_id
    elif token_role != user.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token role does not match the account role or an active scoped assignment.",
        )
    else:
        user.active_role = user.role
        user.active_event_id = None
        user.active_organization_id = user.organization_id

    return user


def require_roles(allowed_roles: List[str]):
    """Enforce role permissions without a global-admin bypass inside event sessions."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        effective_role = getattr(current_user, "active_role", current_user.role)
        active_event_id = getattr(current_user, "active_event_id", None)

        if effective_role == "SUPER_ADMIN" and not active_event_id:
            return current_user
        if effective_role in allowed_roles:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: Role '{effective_role}' is not authorized. Required: {allowed_roles}",
        )

    return role_checker


def get_current_tenant_user(
    x_organization_id: Optional[str] = Header(None, alias="x-organization-id"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Verify organization scope; a missing client header is not authorization."""
    active_role = getattr(current_user, "active_role", current_user.role)
    active_event_id = getattr(current_user, "active_event_id", None)
    requested_org = x_organization_id
    if not requested_org or requested_org in ("undefined", "null", ""):
        requested_org = getattr(current_user, "active_organization_id", None) or current_user.organization_id

    # A platform session may perform platform-wide governance. A scoped event
    # session may not use the global role on its underlying account to escape.
    if active_role == "SUPER_ADMIN" and not active_event_id and not requested_org:
        return current_user

    if not requested_org:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="An authorized organization context is required.",
        )

    # Check direct user organization assignment
    if current_user.organization_id == requested_org and active_role in ("SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"):
        return current_user

    if active_role == "SUPER_ADMIN" and not active_event_id:
        return current_user

    # Check organization_memberships table
    membership = (
        db.query(OrganizationMembership)
        .filter(
            OrganizationMembership.user_id == current_user.id,
            OrganizationMembership.organization_id == requested_org,
            OrganizationMembership.status == "ACTIVE",
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cross-Tenant Violation: You are not an active member of organization '{requested_org}'.",
        )

    return current_user

