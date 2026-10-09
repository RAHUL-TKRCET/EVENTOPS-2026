import { Venue, Bench } from "@/types";
import { apiRequest } from "./config";

export const venuesApi = {
  async getAll(eventId = "evt-01"): Promise<Venue[]> {
    return apiRequest<Venue[]>(`/venues?eventId=${encodeURIComponent(eventId)}`);
  },

  async getById(id: string): Promise<Venue> {
    return apiRequest<Venue>(`/venues/${id}`);
  },

  async create(data: Partial<Venue>): Promise<Venue> {
    return apiRequest<Venue>("/venues", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getBenches(venueId: string): Promise<Bench[]> {
    return apiRequest<Bench[]>(`/venues/${venueId}/benches`);
  },
};
