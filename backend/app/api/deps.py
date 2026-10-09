from typing import List, Optional
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.entities import User, OrganizationMembership

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Validate Bearer JWT and return authenticated User record from database."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token claims.",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with token no longer exists.",
        )

    return user


def require_roles(allowed_roles: List[str]):
    """Enforce granular Role-Based Access Control on endpoint."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == "SUPER_ADMIN":
            return current_user

        if current_user.role in allowed_roles:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: Role '{current_user.role}' is not authorized. Required: {allowed_roles}",
        )

    return role_checker


def get_current_tenant_user(
    x_organization_id: Optional[str] = Header(None, alias="x-organization-id"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Enforce strict tenant isolation: verify caller actually belongs to organization."""
    if not x_organization_id or x_organization_id in ("undefined", "null", ""):
        return current_user

    # Super Admins have platform-wide multi-tenant governance rights
    if current_user.role == "SUPER_ADMIN":
        return current_user

    # Check direct user organization assignment
    if current_user.organization_id == x_organization_id:
        return current_user

    # Check organization_memberships table
    membership = (
        db.query(OrganizationMembership)
        .filter(
            OrganizationMembership.user_id == current_user.id,
            OrganizationMembership.organization_id == x_organization_id,
            OrganizationMembership.status == "ACTIVE",
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cross-Tenant Violation: You are not an active member of organization '{x_organization_id}'.",
        )

    return current_user

