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
    phone: Optional[str] = None
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
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    # Public registration may create only a participant or a new organization owner.
    # Event/platform privileges are assigned through trusted administrative workflows.
    role: Optional[UserRole] = "PARTICIPANT"
    organizationId: Optional[str] = None
    organizationName: Optional[str] = Field(default=None, min_length=2, max_length=255)


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


class EventRegistrationRequest(BaseModel):
    eventId: str = Field(min_length=1, max_length=64)


class EventRegistrationStatusResponse(BaseModel):
    eventId: str
    eventName: str
    registered: bool
    registrationId: Optional[str] = None
    status: Optional[str] = None
    createdAt: Optional[str] = None


class EventRegistrationResult(BaseModel):
    eventId: str
    eventName: str
    registrationId: str
    status: str
    createdAt: Optional[str] = None
    session: TokenResponse


class EventRegistrationSummary(BaseModel):
    eventId: str
    eventName: str
    status: str
    createdAt: Optional[str] = None



class PublicEventRegistrationRequest(BaseModel):
    """Unauthenticated participant registration for a published event."""
    eventId: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=50)
    organizationOrSchool: Optional[str] = Field(default=None, max_length=100)


class PublicEventRegistrationResponse(BaseModel):
    eventId: str
    eventName: str
    registrationId: str
    status: str
    createdAt: Optional[str] = None
    emailStatus: Literal["sent", "pending", "unavailable"]
    message: str


class ProfileUpdateRequest(BaseModel):
    """Fields the signed-in user may update on their own profile."""
    name: str = Field(min_length=2, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
