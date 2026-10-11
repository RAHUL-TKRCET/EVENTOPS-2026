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
    organizationId: Optional[str] = None
    organizationName: Optional[str] = Field(default=None, max_length=255)


class TokenResponse(BaseModel):
    user: UserResponse
    token: str
    accessToken: str
    refreshToken: str
    expiresIn: int = 900


class RoleSwitchRequest(BaseModel):
    targetRole: UserRole
    eventId: Optional[str] = None
    organizationId: Optional[str] = None


class RoleSwitchResponse(BaseModel):
    message: str
    role: UserRole
    token: str
    accessToken: str
    refreshToken: str
    expiresIn: int = 900


class VerifyInviteRequest(BaseModel):
    inviteCode: str






class EventInvitationCreateRequest(BaseModel):
    eventId: str = Field(min_length=1, max_length=64)
    email: EmailStr
    role: UserRole
    expiresInHours: int = Field(default=72, ge=1, le=168)


class EventInvitationCreateResponse(BaseModel):
    invitationId: str
    eventId: str
    email: EmailStr
    role: UserRole
    invitationToken: str
    expiresAt: str
    message: str


class EventInvitationRedeemRequest(BaseModel):
    invitationToken: str = Field(min_length=32, max_length=256)
    password: str = Field(min_length=8, max_length=128)
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)


class VerifyInviteResponse(BaseModel):
    valid: bool
    role: Optional[str] = None
    organizationId: Optional[str] = None
    organizationName: Optional[str] = None
    eventId: Optional[str] = None
    eventName: Optional[str] = None
    message: str
