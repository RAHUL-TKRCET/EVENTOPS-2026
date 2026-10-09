import { Team, CheckInStatus } from "@/types";
import { apiRequest } from "./config";

export const teamsApi = {
  async getAll(eventId = "evt-01"): Promise<Team[]> {
    return apiRequest<Team[]>(`/teams?eventId=${encodeURIComponent(eventId)}`);
  },

  async getById(id: string): Promise<Team> {
    return apiRequest<Team>(`/teams/${id}`);
  },

  async register(data: Partial<Team>): Promise<Team> {
    return apiRequest<Team>("/teams", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateCheckIn(teamId: string, status: CheckInStatus): Promise<Team> {
    return apiRequest<Team>(`/teams/${teamId}/checkin`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async scanQrToken(token: string, eventId = "evt-01"): Promise<{ success: boolean; team: Team; message: string }> {
    return apiRequest<{ success: boolean; team: Team; message: string }>("/teams/scan", {
      method: "POST",
      body: JSON.stringify({ qrToken: token, eventId }),
    });
  },
};

export const attendanceApi = {
  async getMetrics(eventId = "evt-01") {
    return apiRequest(`/attendance/metrics?eventId=${encodeURIComponent(eventId)}`);
  },

  async getRecords(eventId = "evt-01") {
    return apiRequest(`/attendance/records?eventId=${encodeURIComponent(eventId)}`);
  },
};
