import { apiRequest } from "./config";

export interface ApiResourceItem {
  id: string;
  eventId?: string;
  category: string;
  itemName: string;
  totalQuantity: number;
  distributedQuantity: number;
  unit: string;
}

export interface ScannedResourceTeam {
  teamId: string;
  eventId: string;
  teamName: string;
  leadName: string;
  leadEmail: string;
  projectTitle: string | null;
  registrationStatus: string;
  checkInStatus: string;
  memberCount: number;
}

export const resourcesApi = {
  async getAll(eventId: string): Promise<ApiResourceItem[]> {
    if (!eventId.trim()) throw new Error("Select an event before loading inventory.");
    return apiRequest<ApiResourceItem[]>(`/resources?eventId=${encodeURIComponent(eventId)}`);
  },

  async scanTeam(eventId: string, qrToken: string): Promise<ScannedResourceTeam> {
    return apiRequest<ScannedResourceTeam>("/resources/scan-team", {
      method: "POST",
      body: JSON.stringify({ eventId, qrToken }),
    });
  },

  async distribute(resourceId: string, teamId: string) {
    return apiRequest<{ success: boolean; resourceId: string; distributedQuantity: number; totalQuantity: number }>(
      `/resources/distribute?resourceId=${encodeURIComponent(resourceId)}&teamId=${encodeURIComponent(teamId)}`,
      { method: "POST" },
    );
  },
};
