import {
  EventItem,
  Judge,
  Team,
  Venue,
  Organization,
  Incident,
  Volunteer,
  ResourceItem,
  EvaluationItem,
  Announcement,
  User,
} from "@/types";

export function createFallbackArray<T>(items: T[], fallbackItem: T): T[] {
  return new Proxy(items, {
    get(target, prop, receiver) {
      if (prop === "0" && target.length === 0) {
        return fallbackItem;
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

export const defaultOrganization: Organization = {
  id: "org-01",
  name: "Apex University & Labs",
  type: "Institution",
  subtype: "University",
  description: "Global research university and innovation incubator.",
  country: "India",
  city: "Bangalore",
  website: "https://apex.edu",
  size: "5,000+ Students",
  plan: "Enterprise",
  activeEventsCount: 1,
  membersCount: 45,
  createdAt: "2026-01-10T08:00:00Z",
};

export const defaultUser: User = {
  id: "usr-01",
  name: "Dr. Marcus Vance",
  email: "marcus.vance@mit.edu",
  phone: "+1 (555) 234-5678",
  role: "JUDGE",
  organizationId: "org-01",
  createdAt: "2026-01-15T09:00:00Z",
};

export const defaultEvent: EventItem = {
  id: "evt-01",
  organizationId: "org-01",
  ownerId: "usr-01",
  isPersonalEvent: false,
  location: "Bangalore Campus",
  name: "VISTRA Hackathon 2026",
  type: "Hackathon",
  description: "Annual flagship engineering and rapid prototyping hackathon.",
  startDate: "2026-10-10T09:00:00Z",
  endDate: "2026-10-12T18:00:00Z",
  registrationDeadline: "2026-10-08T23:59:59Z",
  status: "LIVE",
  expectedParticipants: 150,
  registeredTeamsCount: 42,
  currentRound: 1,
  totalRounds: 3,
  venuesCount: 4,
  judgesCount: 12,
  rounds: [
    {
      id: "rnd-01",
      name: "Round 1: Preliminary Architecture & Pitch",
      order: 1,
      status: "IN_PROGRESS",
      startTime: "2026-10-10T10:00:00Z",
      endTime: "2026-10-10T14:00:00Z",
      qualifyingQuota: 20,
      criteria: [
        {
          id: "crit-01",
          name: "Innovation & Novelty",
          maxScore: 25,
          weight: 0.25,
          description: "Technical novelty, problem relevance, and architectural viability.",
        },
        {
          id: "crit-02",
          name: "Technical Execution",
          maxScore: 35,
          weight: 0.35,
          description: "Code quality, system stability, and engineering rigor.",
        },
        {
          id: "crit-03",
          name: "Presentation & Demo",
          maxScore: 40,
          weight: 0.4,
          description: "Clarity of live demonstration and Q&A defense.",
        },
      ],
    },
    {
      id: "rnd-02",
      name: "Round 2: Prototype Deep Dive",
      order: 2,
      status: "UPCOMING",
      startTime: "2026-10-11T10:00:00Z",
      endTime: "2026-10-11T16:00:00Z",
      qualifyingQuota: 8,
      criteria: [
        {
          id: "crit-04",
          name: "Scalability & Architecture",
          maxScore: 50,
          weight: 0.5,
          description: "Production readiness and fault tolerance.",
        },
      ],
    },
  ],
  timeSlots: [
    {
      id: "slot-01",
      label: "Slot 1 (10:00 - 11:30)",
      startTime: "10:00",
      endTime: "11:30",
      roundId: "rnd-01",
      capacity: 10,
    },
    {
      id: "slot-02",
      label: "Slot 2 (11:45 - 13:15)",
      startTime: "11:45",
      endTime: "13:15",
      roundId: "rnd-01",
      capacity: 10,
    },
  ],
  rules: [
    {
      id: "rul-01",
      title: "Code of Conduct & Originality",
      description: "All code must be authored during the hackathon window. Open-source libraries permitted.",
      category: "CODE_OF_CONDUCT",
      isMandatory: true,
    },
    {
      id: "rul-02",
      title: "Hardware Safety Constraints",
      description: "Any custom PCB or power supply must be verified by Technical Staff before live demonstration.",
      category: "HARDWARE",
      isMandatory: true,
    },
  ],
};

export const defaultJudge: Judge = {
  id: "J001",
  eventId: "evt-01",
  name: "Dr. Marcus Vance",
  organization: "MIT CSAIL",
  designation: "Principal AI Scientist",
  expertise: ["Distributed Systems", "AI/ML", "Cloud Architecture"],
  domains: ["AI/ML", "Healthcare", "Fintech"],
  assignedTeams: ["T001", "T042"],
  maxTeamCapacity: 8,
  availability: "FULL_TIME",
  availableSlots: ["slot-01", "slot-02"],
  workload: 50,
  workloadStatus: "AVAILABLE",
  conflicts: [],
};

export const defaultTeam: Team = {
  id: "T042",
  eventId: "evt-01",
  name: "BioSense Analytics",
  leadName: "Aarav Sharma",
  leadEmail: "aarav.sharma@example.com",
  members: [
    {
      id: "mem-01",
      name: "Aarav Sharma",
      email: "aarav.sharma@example.com",
      phone: "+91 98765 43210",
      role: "LEADER",
      organizationOrSchool: "IIT Bombay",
      checkInStatus: "CHECKED_IN",
    },
    {
      id: "mem-02",
      name: "Sneha Reddy",
      email: "sneha.reddy@example.com",
      phone: "+91 98765 43211",
      role: "MEMBER",
      organizationOrSchool: "IIT Bombay",
      checkInStatus: "CHECKED_IN",
    },
  ],
  project: {
    title: "Edge AI Non-Invasive Glucose Predictor",
    abstract: "Continuous non-invasive health telemetry utilizing photoplethysmography sensor fusion.",
    domain: "Healthcare",
    techStack: ["Next.js", "PyTorch", "TensorFlow Lite", "FastAPI"],
  },
  registrationStatus: "APPROVED",
  checkInStatus: "CHECKED_IN",
  assignedVenue: "R001",
  assignedVenueName: "Turing Hall",
  assignedBench: "Bench B-14",
  assignedJudges: ["J001"],
  currentRound: 1,
  totalScore: 92.5,
  rank: 1,
  qrCodeToken: "EVT-VISTRA-T042-VERIFIED-AUTH",
};

export const defaultVenue: Venue = {
  id: "R001",
  eventId: "evt-01",
  name: "Turing Innovation Hall",
  building: "Engineering Block 4",
  floor: "2nd Floor",
  capacity: 120,
  hasPower: true,
  hasInternet: true,
  isAccessible: true,
  equipment: ["Gigabit Ethernet", "Overhead Projector", "Auxiliary Power Backup"],
  supportedDomains: ["AI/ML", "Fintech", "Healthcare"],
  status: "ACTIVE",
  benches: [
    {
      id: "B001",
      label: "Bench 01",
      venueId: "R001",
      status: "occupied",
      hasPower: true,
      hasEthernet: true,
      assignedTeamId: "T042",
      assignedTeamName: "BioSense Analytics",
    },
    {
      id: "B002",
      label: "Bench 02",
      venueId: "R001",
      status: "available",
      hasPower: true,
      hasEthernet: true,
    },
  ],
};

export const defaultIncident: Incident = {
  id: "inc-01",
  eventId: "evt-01",
  title: "Wi-Fi Access Point 3 Degradation",
  category: "NETWORK",
  priority: "MEDIUM",
  status: "RESOLVED",
  reportedBy: "Volunteer Tech",
  location: "Turing Hall, Zone B",
  description: "Brief packet drop observed during opening ceremony.",
  createdAt: "2026-10-10T11:00:00Z",
  updatedAt: "2026-10-10T11:30:00Z",
};

export const defaultVolunteer: Volunteer = {
  id: "vol-01",
  eventId: "evt-01",
  name: "Priya Nair",
  phone: "+91 98111 22334",
  email: "priya.nair@example.com",
  role: "Hall Coordinator",
  zone: "Zone A - Turing Hall",
  currentShift: "Morning Shift (08:00 - 14:00)",
  assignedTasksCount: 4,
  completedTasksCount: 3,
  status: "ON_DUTY",
};

export const defaultOptimizationResults = {
  totalTeamsAllocated: 0,
  unallocatedTeamsCount: 0,
  hardConstraintViolations: 0,
  softConstraintSatisfactionPct: 100,
  overallScorePct: 98,
  judgeWorkloadStandardDeviation: 0.4,
  venueUtilizationPct: 85,
  runtimeMs: 420,
  matrix: [],
  conflicts: [],
  aiInsights: ["Solver converged in 420ms with 0 hard constraint violations."],
};

