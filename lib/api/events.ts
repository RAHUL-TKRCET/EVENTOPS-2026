import { EventItem } from "@/types";
import { apiRequest } from "./config";

export const eventsApi = {
  async getAll(organizationId?: string): Promise<EventItem[]> {
    const query = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
    return apiRequest<EventItem[]>(`/events${query}`);
  },

  async getPublicList(): Promise<EventItem[]> {
    return apiRequest<EventItem[]>("/events/public", {
      headers: { Authorization: "" },
    });
  },

  async getById(id: string): Promise<EventItem> {
    return apiRequest<EventItem>(`/events/${encodeURIComponent(id)}`);
  },

  async getPublicById(id: string): Promise<EventItem> {
    return apiRequest<EventItem>(`/events/${encodeURIComponent(id)}/public`, {
      headers: { Authorization: "" },
    });
  },

  async create(data: Partial<EventItem>): Promise<EventItem> {
    return apiRequest<EventItem>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, updates: Partial<EventItem>): Promise<EventItem> {
    return apiRequest<EventItem>(`/events/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async publish(id: string): Promise<EventItem> {
    return apiRequest<EventItem>(`/events/${encodeURIComponent(id)}/publish`, {
      method: "POST",
    });
  },

  async deleteDraft(id: string): Promise<void> {
    return apiRequest<void>(`/events/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  async getMembers(eventId: string): Promise<any[]> {
    return apiRequest<any[]>(`/events/${eventId}/members`);
  },
};
