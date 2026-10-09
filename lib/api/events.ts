import { EventItem } from "@/types";
import { apiRequest } from "./config";

export const eventsApi = {
  async getAll(organizationId?: string): Promise<EventItem[]> {
    const query = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return apiRequest<EventItem[]>(`/events${query}`);
  },

  async getById(id: string): Promise<EventItem> {
    return apiRequest<EventItem>(`/events/${id}`);
  },

  async create(data: Partial<EventItem>): Promise<EventItem> {
    return apiRequest<EventItem>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, updates: Partial<EventItem>): Promise<EventItem> {
    return apiRequest<EventItem>(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async getMembers(eventId: string): Promise<any[]> {
    return apiRequest<any[]>(`/events/${eventId}/members`);
  },
};
