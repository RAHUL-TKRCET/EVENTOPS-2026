import { Organization } from "@/types";
import { mockOrganizations } from "@/lib/mock-data/organizations";

export const organizationsApi = {
  async getAll(): Promise<Organization[]> {
    await new Promise((r) => setTimeout(r, 200));
    return [...mockOrganizations];
  },

  async getById(id: string): Promise<Organization | undefined> {
    await new Promise((r) => setTimeout(r, 150));
    return mockOrganizations.find((o) => o.id === id);
  },

  async create(data: Partial<Organization>): Promise<Organization> {
    await new Promise((r) => setTimeout(r, 350));
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: data.name || "New Organization",
      type: data.type || "Educational Institution",
      country: data.country || "United States",
      city: data.city || "San Francisco",
      website: data.website || "https://example.org",
      size: data.size || "10-50",
      plan: "Starter",
      activeEventsCount: 1,
      membersCount: 1,
      createdAt: new Date().toISOString(),
    };
    mockOrganizations.push(newOrg);
    return newOrg;
  },

  async joinWithCode(code: string): Promise<{ success: boolean; organization: Organization }> {
    await new Promise((r) => setTimeout(r, 300));
    return {
      success: true,
      organization: mockOrganizations[0],
    };
  },
};
