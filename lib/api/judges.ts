import { Judge, JudgeWorkloadStatus } from "@/types";
import { apiRequest } from "./config";

type JudgeApiRecord = {
  id: string;
  eventId: string;
  userId?: string | null;
  name: string;
  email: string;
  organization?: string | null;
  designation?: string | null;
  expertise?: string[];
  domains?: string[];
  assignedTeams?: string[];
  workloadStatus?: JudgeWorkloadStatus;
  maxTeamCapacity?: number;
  invitationStatus?: string;
  emailDelivery?: string;
};

function mapJudge(row: JudgeApiRecord): Judge {
  return {
    id: row.id,
    eventId: row.eventId,
    name: row.name,
    organization: row.organization || "",
    designation: row.designation || "",
    expertise: row.expertise || row.domains || [],
    domains: row.domains || [],
    assignedTeams: row.assignedTeams || [],
    maxTeamCapacity: row.maxTeamCapacity || 10,
    availability: "FULL_TIME",
    availableSlots: [],
    workload: (row.assignedTeams || []).length,
    workloadStatus: row.workloadStatus || "AVAILABLE",
    conflicts: [],
  };
}

export const judgesApi = {
  async getAll(eventId?: string): Promise<Judge[]> {
    const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : "";
    const rows = await apiRequest<JudgeApiRecord[]>(`/judges${query}`);
    return rows.map(mapJudge);
  },

  async getById(id: string): Promise<Judge | undefined> {
    try {
      const row = await apiRequest<JudgeApiRecord>(`/judges/${encodeURIComponent(id)}`);
      return mapJudge(row);
    } catch (error) {
      if (error instanceof Error && /judge not found/i.test(error.message)) return undefined;
      throw error;
    }
  },

  async create(data: Partial<Judge> & { email: string; eventId: string }): Promise<Judge> {
    const row = await apiRequest<JudgeApiRecord>("/judges", {
      method: "POST",
      body: JSON.stringify({
        eventId: data.eventId,
        name: data.name,
        email: data.email,
        organization: data.organization,
        title: data.designation,
        domains: data.domains || data.expertise || [],
        assignedTeams: data.assignedTeams || [],
        maxTeams: data.maxTeamCapacity || 10,
        workloadStatus: data.workloadStatus || "AVAILABLE",
      }),
    });
    return mapJudge(row);
  },

  async updateStatus(judgeId: string, status: JudgeWorkloadStatus): Promise<Judge> {
    const row = await apiRequest<JudgeApiRecord>(`/judges/${encodeURIComponent(judgeId)}`, {
      method: "PATCH",
      body: JSON.stringify({ workloadStatus: status }),
    });
    return mapJudge(row);
  },

  async assignTeams(judgeId: string, teamIds: string[]): Promise<Judge> {
    const row = await apiRequest<JudgeApiRecord>(`/judges/${encodeURIComponent(judgeId)}/assignments`, {
      method: "PUT",
      body: JSON.stringify(teamIds),
    });
    return mapJudge(row);
  },
};
