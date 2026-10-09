import { CheckInStatus } from "../../types";
import { AttendanceService } from "../attendance/attendance.service";

export interface TeamEntity {
  id: string;
  eventId: string;
  name: string;
  leadName: string;
  leadEmail: string;
  project: {
    title: string;
    abstract: string;
    domain: string;
    repoUrl?: string;
    demoUrl?: string;
    techStack: string[];
    hardwareRequirements?: string[];
  };
  members: any[];
  registrationStatus: "APPROVED" | "PENDING" | "REJECTED";
  checkInStatus: CheckInStatus;
  checkedInTime?: string;
  assignedVenue?: string;
  assignedVenueName?: string;
  assignedBench?: string;
  assignedJudges: string[];
  currentRound: number;
  totalScore: number;
  rank?: number;
  qrCodeToken: string;
}

export const inMemoryTeams: TeamEntity[] = [
  {
    id: "T001",
    eventId: "evt-01",
    name: "NeuralPulse Labs",
    leadName: "Aarav Sharma",
    leadEmail: "aarav.sharma@tkrcet.ac.in",
    project: {
      title: "BioTelemetry Edge: Low-Latency EEG Streamer",
      abstract: "Ultra-low power wearable biosignal classifier running quantization models on edge ESP32 microcontrollers.",
      domain: "HealthTech & Bio",
      repoUrl: "https://github.com/neuralpulse/biotelemetry",
      demoUrl: "https://biopulse.demo",
      techStack: ["C++", "PyTorch", "ESP-IDF", "WebSockets"],
      hardwareRequirements: ["Isolated Subnet", "Dual High-Power Outlets"],
    },
    members: [
      { id: "M001", name: "Aarav Sharma", email: "aarav.sharma@tkrcet.ac.in", phone: "+91 98765 43210", role: "LEADER", organizationOrSchool: "TKRCET", dietaryPreference: "VEG", tshirtSize: "L", checkInStatus: "CHECKED_IN", checkedInAt: "2026-10-15T09:15:00Z" },
      { id: "M002", name: "Ananya Iyer", email: "ananya.i@tkrcet.ac.in", phone: "+91 98765 43211", role: "MEMBER", organizationOrSchool: "TKRCET", dietaryPreference: "NON_VEG", tshirtSize: "M", checkInStatus: "CHECKED_IN", checkedInAt: "2026-10-15T09:18:00Z" },
      { id: "M003", name: "Rohan Varma", email: "rohan.v@tkrcet.ac.in", phone: "+91 98765 43212", role: "MEMBER", organizationOrSchool: "TKRCET", dietaryPreference: "VEG", tshirtSize: "XL", checkInStatus: "ABSENT" },
    ],
    registrationStatus: "APPROVED",
    checkInStatus: "PARTIAL",
    checkedInTime: "2026-10-15T09:15:00Z",
    assignedVenue: "R001",
    assignedVenueName: "Turing Lab 101",
    assignedBench: "B004",
    assignedJudges: ["J001", "J004"],
    currentRound: 1,
    totalScore: 84.5,
    rank: 1,
    qrCodeToken: "EO-PASS-T001-TOKEN-CRYPT-2026",
  },
  {
    id: "T002",
    eventId: "evt-01",
    name: "QuantumSentinel",
    leadName: "Devika Menon",
    leadEmail: "devika.m@iitb.ac.in",
    project: {
      title: "Post-Quantum Mesh Encryption Daemon",
      abstract: "Kyber-based zero-trust encrypted mesh radio communication for disaster relief command channels.",
      domain: "CyberSecurity",
      repoUrl: "https://github.com/quantumsentinel/core",
      techStack: ["Rust", "Linux Kernel", "Liboqs"],
    },
    members: [
      { id: "M004", name: "Devika Menon", email: "devika.m@iitb.ac.in", phone: "+91 91234 56789", role: "LEADER", organizationOrSchool: "IIT Bombay", dietaryPreference: "VEG", tshirtSize: "M", checkInStatus: "CHECKED_IN", checkedInAt: "2026-10-15T09:30:00Z" },
      { id: "M005", name: "Kabir Khan", email: "kabir.k@iitb.ac.in", phone: "+91 91234 56790", role: "MEMBER", organizationOrSchool: "IIT Bombay", dietaryPreference: "NON_VEG", tshirtSize: "L", checkInStatus: "CHECKED_IN", checkedInAt: "2026-10-15T09:32:00Z" },
    ],
    registrationStatus: "APPROVED",
    checkInStatus: "CHECKED_IN",
    checkedInTime: "2026-10-15T09:30:00Z",
    assignedVenue: "R001",
    assignedVenueName: "Turing Lab 101",
    assignedBench: "B005",
    assignedJudges: ["J002", "J005"],
    currentRound: 1,
    totalScore: 79.0,
    rank: 2,
    qrCodeToken: "EO-PASS-T002-TOKEN-CRYPT-2026",
  },
];

export class TeamsService {
  public static getAll(eventId: string) {
    return inMemoryTeams.filter((t) => t.eventId === eventId);
  }

  public static getById(id: string) {
    return inMemoryTeams.find((t) => t.id === id);
  }

  public static create(data: Partial<TeamEntity>) {
    const teamId = `T${String(inMemoryTeams.length + 1).padStart(3, "0")}`;
    const token = AttendanceService.generateSignedQRToken(teamId, data.eventId || "evt-01");

    const newTeam: TeamEntity = {
      id: teamId,
      eventId: data.eventId || "evt-01",
      name: data.name || "Untitled Team",
      leadName: data.leadName || "Team Lead",
      leadEmail: data.leadEmail || "lead@team.demo",
      project: data.project || {
        title: "Untitled Innovation",
        abstract: "Submitted via EVENTOPS",
        domain: "AI / Machine Learning",
        techStack: ["Next.js", "Python"],
      },
      members: data.members || [],
      registrationStatus: "APPROVED",
      checkInStatus: "NOT_CHECKED_IN",
      assignedJudges: [],
      currentRound: 1,
      totalScore: 0,
      qrCodeToken: token,
    };

    inMemoryTeams.push(newTeam);
    return newTeam;
  }

  public static updateProject(teamId: string, projectData: any) {
    const team = this.getById(teamId);
    if (!team) throw new Error("Team not found");
    team.project = { ...team.project, ...projectData };
    return team;
  }
}
