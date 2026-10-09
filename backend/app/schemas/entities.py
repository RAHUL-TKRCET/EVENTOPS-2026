from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


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


# --------------------- Teams ---------------------
class TeamMemberSchema(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    phone: Optional[str] = None
    role: str = "MEMBER"
    organizationOrSchool: Optional[str] = None
    dietaryPreference: str = "VEG"
    tshirtSize: str = "L"
    checkInStatus: str = "ABSENT"
    checkedInAt: Optional[str] = None


class TeamProjectSchema(BaseModel):
    title: str
    abstract: Optional[str] = None
    domain: str
    repoUrl: Optional[str] = None
    demoUrl: Optional[str] = None
    techStack: List[str] = []
    hardwareRequirements: List[str] = []


class TeamCreate(BaseModel):
    eventId: str = "evt-01"
    name: str
    leadName: str
    leadEmail: str
    project: Optional[TeamProjectSchema] = None
    members: Optional[List[TeamMemberSchema]] = []


class TeamResponse(BaseModel):
    id: str
    eventId: str
    name: str
    leadName: str
    leadEmail: str
    members: List[TeamMemberSchema] = []
    project: TeamProjectSchema
    registrationStatus: str
    checkInStatus: str
    checkedInTime: Optional[str] = None
    assignedVenue: Optional[str] = None
    assignedVenueName: Optional[str] = None
    assignedBench: Optional[str] = None
    assignedJudges: List[str] = []
    currentRound: int
    totalScore: float = 0.0
    rank: Optional[int] = None
    qrCodeToken: str


class CheckInUpdate(BaseModel):
    status: str = Field(..., pattern="^(CHECKED_IN|NOT_CHECKED_IN|PARTIAL|ABSENT)$")


class QRScanRequest(BaseModel):
    qrToken: str
    eventId: Optional[str] = "evt-01"


# --------------------- Venues & Benches ---------------------
class BenchResponse(BaseModel):
    id: str
    label: str
    status: str
    hasPower: bool
    hasEthernet: bool
    assignedTeamId: Optional[str] = None
    assignedTeamName: Optional[str] = None


class VenueCreate(BaseModel):
    eventId: str = "evt-01"
    name: str
    building: str
    floor: str
    capacity: int
    hasPower: bool = True
    hasInternet: bool = True
    isAccessible: bool = True
    equipment: List[str] = []
    supportedDomains: List[str] = []


class VenueResponse(BaseModel):
    id: str
    eventId: str
    name: str
    building: str
    floor: str
    capacity: int
    hasPower: bool
    hasInternet: bool
    isAccessible: bool
    equipment: List[str] = []
    supportedDomains: List[str] = []
    status: str
    benches: List[BenchResponse] = []


# --------------------- Evaluations ---------------------
class EvaluationCreate(BaseModel):
    eventId: str = "evt-01"
    roundId: str
    teamId: str
    scores: Dict[str, float]
    feedback: Optional[str] = ""
    strengths: Optional[str] = ""
    areasToImprove: Optional[str] = ""
    status: str = "SUBMITTED"


class EvaluationResponse(BaseModel):
    id: str
    eventId: str
    roundId: str
    judgeId: str
    teamId: str
    teamName: Optional[str] = None
    scores: Dict[str, float]
    totalScore: float
    feedback: Optional[str] = None
    strengths: Optional[str] = None
    areasToImprove: Optional[str] = None
    status: str
    submittedAt: str


# --------------------- Allocation & OR-Tools ---------------------
class HardConstraintSchema(BaseModel):
    id: str
    name: str
    description: str
    category: str
    enabled: bool = True


class SoftConstraintSchema(BaseModel):
    id: str
    name: str
    description: str
    weight: float = 1.0
    enabled: bool = True


class OptimizationRequest(BaseModel):
    eventId: str = "evt-01"
    roundId: Optional[str] = "rnd-1"
    balanceJudgeWorkload: bool = True
    enforcePowerSafety: bool = True
    clusterDomains: bool = True


# --------------------- Incidents ---------------------
class IncidentCreate(BaseModel):
    eventId: str = "evt-01"
    title: str
    description: str
    category: str
    severity: str = "MEDIUM"
    location: str
    reportedBy: str


class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    assignedTo: Optional[str] = None
    resolutionNotes: Optional[str] = None

