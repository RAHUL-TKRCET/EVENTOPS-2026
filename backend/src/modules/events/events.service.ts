import { EventStatus } from "../../types";

export interface EventEntity {
  id: string;
  organizationId: string | null;
  ownerId: string;
  isPersonalEvent: boolean;
  name: string;
  type: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  status: EventStatus;
  expectedParticipants: number;
  registeredTeamsCount: number;
  currentRound: number;
  totalRounds: number;
  rounds: any[];
  timeSlots: any[];
  rules: any[];
  createdAt: string;
}

export const inMemoryEvents: EventEntity[] = [
  {
    id: "evt-01",
    organizationId: "org-01",
    ownerId: "usr-event",
    isPersonalEvent: false,
    name: "VISTERA 2026 — Flagship National Hackathon",
    type: "Hackathon",
    description: "National-level 36-hour hackathon focusing on AI systems, robotics, and distributed architectures.",
    location: "Main Campus Engineering Block, Hall 1-4",
    startDate: "2026-10-15T09:00:00Z",
    endDate: "2026-10-17T18:00:00Z",
    registrationDeadline: "2026-10-12T23:59:59Z",
    status: "LIVE",
    expectedParticipants: 120,
    registeredTeamsCount: 120,
    currentRound: 1,
    totalRounds: 3,
    rounds: [
      {
        id: "rnd-01",
        name: "Round 1 — Preliminary Architecture Pitch",
        order: 1,
        status: "IN_PROGRESS",
        startTime: "2026-10-15T14:00:00Z",
        endTime: "2026-10-15T18:00:00Z",
        qualifyingQuota: 30,
        criteria: [
          { id: "c1", name: "Technical Feasibility", maxScore: 25, weight: 0.25, description: "System architecture and execution viability" },
          { id: "c2", name: "Innovation & Originality", maxScore: 25, weight: 0.25, description: "Novelty of approach" },
          { id: "c3", name: "Implementation Completeness", maxScore: 25, weight: 0.25, description: "Code quality and working demo" },
          { id: "c4", name: "Impact & Presentation", maxScore: 25, weight: 0.25, description: "Clarity of pitch and real-world value" },
        ],
      },
      {
        id: "rnd-02",
        name: "Round 2 — Deep Technical Audit",
        order: 2,
        status: "UPCOMING",
        startTime: "2026-10-16T10:00:00Z",
        endTime: "2026-10-16T14:00:00Z",
        qualifyingQuota: 10,
        criteria: [
          { id: "c5", name: "Scalability & Resilience", maxScore: 50, weight: 0.5, description: "Load tolerance and architecture patterns" },
          { id: "c6", name: "Code Quality & Documentation", maxScore: 50, weight: 0.5, description: "Clean code and maintainability" },
        ],
      },
      {
        id: "rnd-03",
        name: "Grand Finale — Jury Defense",
        order: 3,
        status: "UPCOMING",
        startTime: "2026-10-17T11:00:00Z",
        endTime: "2026-10-17T16:00:00Z",
        qualifyingQuota: 3,
        criteria: [
          { id: "c7", name: "Overall Mastery", maxScore: 100, weight: 1.0, description: "Final verdict from executive jury" },
        ],
      },
    ],
    timeSlots: [
      { id: "ts-1", label: "Slot A (14:00 - 15:00)", startTime: "14:00", endTime: "15:00", roundId: "rnd-01", capacity: 30 },
      { id: "ts-2", label: "Slot B (15:00 - 16:00)", startTime: "15:00", endTime: "16:00", roundId: "rnd-01", capacity: 30 },
      { id: "ts-3", label: "Slot C (16:00 - 17:00)", startTime: "16:00", endTime: "17:00", roundId: "rnd-01", capacity: 30 },
      { id: "ts-4", label: "Slot D (17:00 - 18:00)", startTime: "17:00", endTime: "18:00", roundId: "rnd-01", capacity: 30 },
    ],
    rules: [
      { id: "r1", title: "Original Work", description: "All code must be authored during the hackathon timeline.", category: "SUBMISSION", isMandatory: true },
      { id: "r2", title: "Safety & Conduct", description: "Zero tolerance for harassment or unsafe hardware usage.", category: "CODE_OF_CONDUCT", isMandatory: true },
    ],
    createdAt: "2026-01-10T00:00:00Z",
  },
];

export class EventsService {
  public static getAll(organizationId?: string | null) {
    if (organizationId) {
      return inMemoryEvents.filter((e) => e.organizationId === organizationId);
    }
    return inMemoryEvents;
  }

  public static getById(id: string) {
    return inMemoryEvents.find((e) => e.id === id);
  }

  public static create(data: Partial<EventEntity>, ownerId: string) {
    const newEvent: EventEntity = {
      id: `evt-${Date.now()}`,
      organizationId: data.isPersonalEvent ? null : (data.organizationId || "org-01"),
      ownerId,
      isPersonalEvent: Boolean(data.isPersonalEvent),
      name: data.name || "Untitled Operations Event",
      type: data.type || "Hackathon",
      description: data.description || "Managed by EVENTOPS 2026.",
      location: data.location || "Main Venue Block",
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date(Date.now() + 86400000 * 2).toISOString(),
      registrationDeadline: data.registrationDeadline || new Date().toISOString(),
      status: data.status || "DRAFT",
      expectedParticipants: data.expectedParticipants || 100,
      registeredTeamsCount: 0,
      currentRound: 1,
      totalRounds: data.totalRounds || 2,
      rounds: data.rounds || [],
      timeSlots: data.timeSlots || [],
      rules: data.rules || [],
      createdAt: new Date().toISOString(),
    };
    inMemoryEvents.unshift(newEvent);
    return newEvent;
  }

  public static update(id: string, updates: Partial<EventEntity>) {
    const idx = inMemoryEvents.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Event not found");
    inMemoryEvents[idx] = { ...inMemoryEvents[idx], ...updates };
    return inMemoryEvents[idx];
  }

  public static setStatus(id: string, status: EventStatus) {
    return this.update(id, { status });
  }

  public static async addMember(
    eventId: string,
    data: {
      name: string;
      email: string;
      role: string;
      phone?: string;
      title?: string;
      zoneOrDept?: string;
      password?: string;
    },
    addedBy: string
  ) {
    const { db } = await import("../../database/connection");
    const bcrypt = await import("bcryptjs");

    const email = data.email.trim().toLowerCase();
    const memberId = `mem-${Date.now()}`;
    const rawPass = data.password || "EventOps@2026";
    const passwordHash = await bcrypt.hash(rawPass, 10);

    // 1. Check or insert user in PostgreSQL
    const existingUser = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    let userId = existingUser.rows[0]?.id;

    if (!userId) {
      userId = `usr-${Date.now()}`;
      await db.query(
        `INSERT INTO users (id, name, email, password_hash, role, organization_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, data.name, email, passwordHash, data.role, "org-01"]
      );
    }

    // 2. Insert into event_members table
    await db.query(
      `INSERT INTO event_members (id, event_id, user_id, name, email, role, phone, title, zone_or_dept, status, added_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE', $10, NOW())
       ON CONFLICT (event_id, email) DO UPDATE
       SET role = EXCLUDED.role, title = EXCLUDED.title, zone_or_dept = EXCLUDED.zone_or_dept`,
      [memberId, eventId, userId, data.name, email, data.role, data.phone || null, data.title || null, data.zoneOrDept || null, addedBy]
    );

    // 3. Insert into role-specific tables if applicable
    if (data.role === "JUDGE") {
      await db.query(
        `INSERT INTO judges (id, event_id, user_id, name, email, organization, title, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (id) DO NOTHING`,
        [`j-${Date.now()}`, eventId, userId, data.name, email, data.zoneOrDept || "Jury Panel", data.title || "Evaluator"]
      ).catch(() => {});
    }

    if (data.role === "VOLUNTEER") {
      await db.query(
        `INSERT INTO volunteers (id, event_id, user_id, name, email, phone, role, zone, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
         ON CONFLICT (id) DO NOTHING`,
        [`vol-${Date.now()}`, eventId, userId, data.name, email, data.phone || "", data.title || "Volunteer", data.zoneOrDept || "Floor Ops"]
      ).catch(() => {});
    }

    return {
      id: memberId,
      eventId,
      userId,
      name: data.name,
      email,
      role: data.role,
      title: data.title,
      zoneOrDept: data.zoneOrDept,
      defaultPassword: rawPass,
      inviteLink: `http://localhost:3000/events/${eventId}/login?email=${encodeURIComponent(email)}&role=${data.role}`,
    };
  }

  public static async getMembers(eventId: string) {
    const { db } = await import("../../database/connection");
    const r = await db.query(
      `SELECT id, event_id, user_id, name, email, role, phone, title, zone_or_dept, status, created_at
       FROM event_members
       WHERE event_id = $1
       ORDER BY created_at DESC`,
      [eventId]
    );
    return r.rows;
  }

  public static async removeMember(eventId: string, memberId: string) {
    const { db } = await import("../../database/connection");
    await db.query(`DELETE FROM event_members WHERE event_id = $1 AND id = $2`, [eventId, memberId]);
    return { success: true };
  }

  public static async getEventSummary(eventId: string) {
    const { db } = await import("../../database/connection");
    const event = inMemoryEvents.find((e) => e.id === eventId) || inMemoryEvents[0];
    const members = await this.getMembers(eventId);
    const teams = await db.query(
      `SELECT id, name, lead_name, lead_email, project_title, check_in_status, total_score, rank 
       FROM teams WHERE event_id = $1 ORDER BY total_score DESC`,
      [eventId]
    ).catch(() => ({ rows: [] }));
    const attendance = await db.query(
      `SELECT COUNT(*) as count FROM attendance_records WHERE event_id = $1`,
      [eventId]
    ).catch(() => ({ rows: [{ count: 0 }] }));
    const incidents = await db.query(
      `SELECT COUNT(*) as count FROM incidents WHERE event_id = $1`,
      [eventId]
    ).catch(() => ({ rows: [{ count: 0 }] }));

    return {
      event,
      enrolledMembers: members,
      memberCountByRole: members.reduce((acc: any, m: any) => {
        acc[m.role] = (acc[m.role] || 0) + 1;
        return acc;
      }, {}),
      teams: teams.rows,
      totalTeams: teams.rows.length,
      attendanceScans: parseInt(attendance.rows[0]?.count || 0, 10),
      incidentCount: parseInt(incidents.rows[0]?.count || 0, 10),
    };
  }
}

