import { Incident, IncidentStatus } from "@/types";
import { apiRequest } from "./config";

export const incidentsApi = {
  async getAll(eventId = "evt-01"): Promise<Incident[]> {
    return apiRequest<Incident[]>(`/incidents?eventId=${encodeURIComponent(eventId)}`);
  },

  async create(data: Partial<Incident>): Promise<Incident> {
    return apiRequest<Incident>("/incidents", {
      method: "POST",
      body: JSON.stringify({
        eventId: data.eventId || "evt-01",
        title: data.title,
        description: data.description || "",
        category: data.category || "OTHER",
        severity: data.priority || "MEDIUM",
        location: data.location || "General Venue",
        reportedBy: data.reportedBy || "Control Center",
      }),
    });
  },

  async updateStatus(id: string, status: IncidentStatus, notes?: string): Promise<Incident> {
    return apiRequest<Incident>(`/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, resolutionNotes: notes }),
    });
  },
};
