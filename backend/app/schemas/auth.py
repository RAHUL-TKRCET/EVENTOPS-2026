from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field

UserRole = Literal[
    "SUPER_ADMIN",
    "ORGANIZATION_ADMIN",
    "EVENT_ADMIN",
    "COORDINATOR",
    "JUDGE",
    "VOLUNTEER",
    "PARTICIPANT",
    "TECHNICAL_STAFF",
    "RESOURCE_MANAGER",
]


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    organizationId: Optional[str] = None
    createdAt: Optional[str] = None

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=4)
    role: Optional[UserRole] = None


class EventLoginRequest(BaseModel):
    eventId: str
    email: EmailStr
    password: str = Field(min_length=4)
    role: UserRole


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=6)
    role: Optional[UserRole] = "PARTICIPANT"
    organizationId: Optional[str] = "org-01"


class TokenResponse(BaseModel):
    user: UserResponse
    token: str
    accessToken: str
    refreshToken: str
    expiresIn: int = 86400


class RoleSwitchRequest(BaseModel):
    targetRole: UserRole


class RoleSwitchResponse(BaseModel):
    message: str
    role: UserRole
    token: str
    accessToken: str
    refreshToken: str
    expiresIn: int = 86400


class VerifyInviteRequest(BaseModel):
    inviteCode: str


class VerifyInviteResponse(BaseModel):
    valid: bool
    role: Optional[str] = None
    organizationId: Optional[str] = None
    organizationName: Optional[str] = None
    message: str

