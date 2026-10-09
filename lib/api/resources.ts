import { ResourceItem } from "@/types";
import { mockResources } from "@/lib/mock-data/resources";

export const resourcesApi = {
  async getAll(eventId = "evt-01"): Promise<ResourceItem[]> {
    await new Promise((r) => setTimeout(r, 150));
    return mockResources.filter((res) => !eventId || res.eventId === eventId);
  },

  async updateConsumption(resourceId: string, quantityToAdd: number): Promise<ResourceItem> {
    await new Promise((r) => setTimeout(r, 150));
    const item = mockResources.find((r) => r.id === resourceId);
    if (item) {
      item.consumedQuantity = Math.min(item.totalQuantity, item.consumedQuantity + quantityToAdd);
      const remaining = item.totalQuantity - item.consumedQuantity;
      if (remaining <= 0) {
        item.status = "DEPLETED";
      } else if (remaining <= item.lowStockThreshold) {
        item.status = "LOW_STOCK";
      } else {
        item.status = "HEALTHY";
      }
      return { ...item };
    }
    throw new Error("Resource not found");
  },
};
