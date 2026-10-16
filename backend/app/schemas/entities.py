from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr


# --------------------- Events ---------------------
class RoundCriteriaSchema(BaseModel):
    id: str
    name: str
    maxScore: float = 25.0
    weight: float = 0.25
    description: Optional[str] = None


class RoundSchema(BaseModel):
    id: str
    name: str
    order: int
    status: str = "UPCOMING"
    startTime: str
    endTime: str
    qualifyingQuota: int = 20
    criteria: List[RoundCriteriaSchema] = []


class TimeSlotSchema(BaseModel):
    id: str
    label: str
    startTime: str
    endTime: str
    capacity: int = 30


class EventRuleSchema(BaseModel):
    id: str
    title: str
    description: str
    category: str = "ELIGIBILITY"
    isMandatory: bool = True


class PublicEventResponse(BaseModel):
    """Approved event metadata safe to display before an event-role session exists."""
    id: str
    name: str
    type: str
    description: Optional[str] = None
    location: Optional[str] = None
    bannerUrl: Optional[str] = None
    startDate: str
    endDate: str
    registrationDeadline: str
    status: str
    expectedParticipants: int
    currentRound: int
    totalRounds: int


class EventCreate(BaseModel):
    name: str
    type: str = "Hackathon"
    description: Optional[str] = ""
    location: Optional[str] = "Tech Innovation Center"
    organizationId: Optional[str] = None
    isPersonalEvent: bool = False
    startDate: str
    endDate: str
    registrationDeadline: str
    expectedParticipants: int = 100
    totalRounds: int = 2
    rounds: Optional[List[RoundSchema]] = []
    timeSlots: Optional[List[TimeSlotSchema]] = []
    rules: Optional[List[EventRuleSchema]] = []


class EventUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    # Lifecycle transitions are handled by dedicated server-validated endpoints.
    status: Optional[str] = None
    expectedParticipants: Optional[int] = None
    currentRound: Optional[int] = None
    totalRounds: Optional[int] = None


class EventResponse(BaseModel):
    id: str
    organizationId: Optional[str] = None
    ownerId: Optional[str] = None
    isPersonalEvent: bool = False
    name: str
    type: str
    description: Optional[str] = None
    location: Optional[str] = None
    bannerUrl: Optional[str] = None
    startDate: str
    endDate: str
    registrationDeadline: str
    status: str
    expectedParticipants: int
    registeredTeamsCount: int = 0
    currentRound: int
    totalRounds: int
    venuesCount: int = 0
    judgesCount: int = 0
    rounds: List[RoundSchema] = []
    timeSlots: List[TimeSlotSchema] = []
    rules: List[EventRuleSchema] = []

    model_config = {"from_attributes": True}


class JudgeCreate(BaseModel):
    eventId: str
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    organization: Optional[str] = None
    title: Optional[str] = None
    domains: List[str] = []
    assignedTeams: List[str] = []
    maxTeams: int = Field(default=10, ge=1, le=100)
    workloadStatus: str = "AVAILABLE"


class JudgeUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    organization: Optional[str] = None
    title: Optional[str] = None
    maxTeams: Optional[int] = Field(default=None, ge=1, le=100)
    workloadStatus: Optional[str] = None
