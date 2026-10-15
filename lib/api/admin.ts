import { apiRequest } from "./config";

export interface SuperAdminOverview {
  generatedAt: string;
  counts: {
    organizations: number;
    users: number;
    events: number;
    eventMembers: number;
    auditRecords: number;
  };
  eventsByStatus: Record<string, number>;
  recentActivity: Array<{
    id: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    eventId: string | null;
    userRole: string | null;
    createdAt: string | null;
  }>;
}

export const adminApi = {
  getOverview(): Promise<SuperAdminOverview> {
    return apiRequest<SuperAdminOverview>("/admin/overview");
  },
};
