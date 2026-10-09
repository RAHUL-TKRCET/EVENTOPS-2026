import { ResourceItem } from "@/types";
import { apiRequest } from "./config";

export const resourcesApi = {
  async getAll(eventId = "evt-01"): Promise<ResourceItem[]> {
    return apiRequest<ResourceItem[]>(`/resources?eventId=${encodeURIComponent(eventId)}`);
  },

  async distribute(resourceId: string, teamId: string) {
    return apiRequest("/resources/distribute", {
      method: "POST",
      body: JSON.stringify({ resourceId, teamId }),
    });
  },
};
