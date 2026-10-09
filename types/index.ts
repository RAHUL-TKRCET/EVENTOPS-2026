export type UserRole =
  | "SUPER_ADMIN"
  | "ORGANIZATION_ADMIN"
  | "EVENT_ADMIN"
  | "COORDINATOR"
  | "JUDGE"
  | "VOLUNTEER"
  | "PARTICIPANT"
  | "TECHNICAL_STAFF"
  | "RESOURCE_MANAGER";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  organizationId?: string;
  createdAt: string;
}

export type OrganizationCategory = "Institution" | "Business" | "Community";

export type InstitutionSubtype =
  | "College"
  | "University"
  | "School"
  | "Training Institute"
  | "Other Institution";

export type BusinessSubtype =
  | "Company"
  | "Startup"
  | "Enterprise"
  | "Event Agency"
  | "Other Business";

export type CommunitySubtype =
  | "NGO"
  | "Association"
  | "Club"
  | "Community Group"
  | "Other Community";

export type OrganizationType =
  | "Institution"
  | "Business"
  | "Community"
  | "Educational Institution"
  | "Business / Corporate"
  | "Event Organizer"
  | "Community / Non-Profit"
  | "Other";

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  subtype?: string;
  description?: string;
  country: string;
  city: string;
  website?: string;
  size: string;
  logo?: string;
  ownerId?: string;
  contactEmail?: string;
  contactPhone?: string;
  plan: "Free" | "Starter" | "Enterprise";
  activeEventsCount: number;
  membersCount: number;
  createdAt: string;
}

export interface OrganizationMembership {
  userId: string;
  organizationId: string;
  role: UserRole;
  status: "ACTIVE" | "PENDING" | "INVITED";
}

export type WorkspaceMode = "ORGANIZATION" | "PERSONAL";

export type EventType =
  | "Hackathon"
  | "College Fest"
  | "Technical Symposium"
  | "Conference"
  | "Workshop"
  | "Seminar"
  | "Competition"
  | "Sports Event"
  | "Cultural Event"
  | "Job Fair"
  | "Career Fair"
  | "Exhibition"
  | "Meetup"
  | "Festival"
  | "Corporate Event"
  | "Training Program"
  | "Institution Event"
  | "IT / Technology Event"
  | "Community Event"
  | "Custom Event";

export type EventStatus = "DRAFT" | "PUBLISHED" | "UPCOMING" | "LIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";

export interface RoundCriteria {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  description: string;
}

export interface EventRound {
  id: string;
  name: string;
  order: number;
  status: "UPCOMING" | "IN_PROGRESS" | "EVALUATING" | "COMPLETED";
  startTime: string;
  endTime: string;
  qualifyingQuota: number;
  criteria: RoundCriteria[];
}

export interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  roundId: string;
  capacity: number;
}

export interface EventRule {
  id: string;
  title: string;
  description: string;
  category: "ELIGIBILITY" | "SUBMISSION" | "EVALUATION" | "CODE_OF_CONDUCT" | "HARDWARE";
  isMandatory: boolean;
}

export interface EventItem {
  id: string;
  organizationId?: string | null;
  ownerId?: string;
  isPersonalEvent?: boolean;
  location?: string;
  name: string;
  type: EventType;
  description: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: EventStatus;
  expectedParticipants: number;
  registeredTeamsCount: number;
  currentRound: number;
  totalRounds: number;
  venuesCount: number;
  judgesCount: number;
  bannerUrl?: string;
  rounds: EventRound[];
  timeSlots: TimeSlot[];
  rules: EventRule[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "LEADER" | "MEMBER";
  organizationOrSchool: string;
  dietaryPreference?: "VEG" | "NON_VEG" | "JAIN" | "VEGAN";
  tShirtSize?: "S" | "M" | "L" | "XL" | "XXL";
  checkInStatus: "CHECKED_IN" | "ABSENT";
  checkedInAt?: string;
}

export interface ProjectInfo {
  title: string;
  abstract: string;
  domain: string;
  repoUrl?: string;
  demoUrl?: string;
  techStack: string[];
  hardwareRequirements?: string[];
}

export type CheckInStatus = "CHECKED_IN" | "NOT_CHECKED_IN" | "PARTIAL" | "ABSENT";

export interface Team {
  id: string; // T001...
  eventId: string;
  name: string;
  leadName: string;
  leadEmail: string;
  members: TeamMember[];
  project: ProjectInfo;
  registrationStatus: "APPROVED" | "PENDING" | "REJECTED";
  checkInStatus: CheckInStatus;
  checkedInTime?: string;
  assignedVenue?: string; // Room ID e.g., R004
  assignedVenueName?: string;
  assignedBench?: string; // Bench ID e.g., B012
  assignedJudges: string[]; // Judge IDs e.g., ["J007", "J012"]
  currentRound: number;
  totalScore?: number;
  rank?: number;
  qrCodeToken: string;
}

export type BenchStatus = "available" | "occupied" | "reserved" | "maintenance";

export interface Bench {
  id: string; // B001
  label: string; // "Bench 12"
  venueId: string;
  status: BenchStatus;
  hasPower: boolean;
  hasEthernet: boolean;
  assignedTeamId?: string;
  assignedTeamName?: string;
}

export interface Venue {
  id: string; // R001
  eventId: string;
  name: string; // "Hall A - Turing Hall"
  building: string;
  floor: string;
  capacity: number;
  hasPower: boolean;
  hasInternet: boolean;
  isAccessible: boolean;
  equipment: string[];
  supportedDomains: string[];
  status: "ACTIVE" | "FULL" | "STANDBY" | "MAINTENANCE";
  benches: Bench[];
}

export type JudgeWorkloadStatus = "AVAILABLE" | "BUSY" | "OVERLOADED" | "UNAVAILABLE";

export interface Judge {
  id: string; // J001
  eventId: string;
  name: string;
  photoUrl?: string;
  organization: string;
  designation: string;
  expertise: string[];
  domains: string[];
  assignedTeams: string[];
  maxTeamCapacity: number;
  availability: "FULL_TIME" | "PART_TIME" | "UNAVAILABLE";
  availableSlots: string[];
  workload: number; // percentage 0-100
  workloadStatus: JudgeWorkloadStatus;
  conflicts: string[]; // e.g. ["Cannot evaluate Team T012: Alumni affiliation"]
}

export interface HardConstraint {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: "CRITICAL";
}

export interface SoftConstraint {
  id: string;
  name: string;
  description: string;
  weight: number; // 1 to 10
  enabled: boolean;
}

export interface OptimizationConfig {
  algorithm: "CP-SAT" | "GREEDY_HYBRID" | "SIMULATED_ANNEALING";
  maxRuntimeSeconds: number;
  balanceJudgeWorkloadWeight: number;
  domainMatchWeight: number;
  consecutiveSlotWeight: number;
  venueProximityWeight: number;
}

export interface AllocationMatrixRow {
  id: string;
  teamId: string;
  teamName: string;
  domain: string;
  venueId: string;
  venueName: string;
  benchId: string;
  benchLabel: string;
  judgeIds: string[];
  judgeNames: string[];
  timeSlot: string;
  round: number;
  status: "OPTIMAL" | "CONFLICT_RESOLVED" | "MANUAL_OVERRIDE" | "FLAGGED";
  score: number; // match quality score
  satisfactionNotes: string;
}

export interface OptimizationResults {
  totalTeamsAllocated: number;
  unallocatedTeamsCount: number;
  hardConstraintViolations: number;
  softConstraintSatisfactionPct: number;
  overallScorePct: number;
  judgeWorkloadStandardDeviation: number;
  venueUtilizationPct: number;
  runtimeMs: number;
  matrix: AllocationMatrixRow[];
  conflicts: string[];
  aiInsights: string[];
}

export interface EvaluationItem {
  id: string;
  eventId: string;
  roundId: string;
  judgeId: string;
  teamId: string;
  scores: Record<string, number>; // criteriaId -> score
  totalScore: number;
  feedback: string;
  strengths: string;
  areasToImprove: string;
  status: "DRAFT" | "SUBMITTED" | "LOCKED";
  submittedAt?: string;
}

export type TaskStatus = "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED";

export interface VolunteerTask {
  id: string;
  title: string;
  description: string;
  zone: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: TaskStatus;
  assignedVolunteerId: string;
  assignedVolunteerName: string;
  dueTime: string;
}

export interface Volunteer {
  id: string;
  eventId: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  zone: string;
  currentShift: string;
  assignedTasksCount: number;
  completedTasksCount: number;
  status: "ON_DUTY" | "ON_BREAK" | "OFF_DUTY";
}

export interface ResourceItem {
  id: string;
  eventId: string;
  name: string;
  category: "FOOD" | "HARDWARE" | "KIT" | "BADGE" | "CERTIFICATE" | "AUDIO_VISUAL";
  totalQuantity: number;
  allocatedQuantity: number;
  consumedQuantity: number;
  unit: string;
  location: string;
  lowStockThreshold: number;
  status: "HEALTHY" | "LOW_STOCK" | "DEPLETED";
}

export type IncidentPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type IncidentStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED";

export interface Incident {
  id: string;
  eventId: string;
  title: string;
  category: "NETWORK" | "POWER" | "HARDWARE" | "MEDICAL" | "DISPUTE" | "FACILITY" | "OTHER";
  priority: IncidentPriority;
  status: IncidentStatus;
  reportedBy: string;
  location: string;
  assignedTo?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface Announcement {
  id: string;
  eventId: string;
  title: string;
  message: string;
  targetAudience:
    | "ALL"
    | "PARTICIPANTS"
    | "JUDGES"
    | "VOLUNTEERS"
    | "COORDINATORS"
    | "TECHNICAL_STAFF"
    | "RESOURCE_MANAGERS";
  channels: ("IN_APP" | "EMAIL" | "SMS" | "WHATSAPP")[];
  sentBy: string;
  sentAt: string;
  recipientCount: number;
}

export interface AIChatMessage {
  id: string;
  sender: "USER" | "AI";
  timestamp: string;
  content: string;
  structuredData?: {
    type: "JUDGE_OVERLOAD" | "ABSENT_TEAMS" | "ROOM_AVAILABILITY" | "INCIDENT_SUMMARY" | "ACTION_RECOMMENDATION";
    payload: any;
  };
  suggestedActions?: {
    label: string;
    actionType: string;
    payload?: any;
  }[];
}
