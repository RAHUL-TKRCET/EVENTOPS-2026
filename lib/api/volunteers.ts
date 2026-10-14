import { apiRequest } from "./config";

export type VolunteerTaskStatus = "PENDING" | "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED";

export interface VolunteerTaskItem {
  id: string;
  eventId: string;
  volunteerId: string | null;
  title: string;
  description: string | null;
  zone: string | null;
  status: VolunteerTaskStatus;
  dueTime: string | null;
}

export interface VolunteerWorkspace {
  eventId: string;
  eventName: string;
  volunteer: {
    id: string;
    name: string;
    role: string;
    zone: string;
    status: string;
  };
  tasks: VolunteerTaskItem[];
}

export const volunteersApi = {
  getMine(eventId: string): Promise<VolunteerWorkspace> {
    if (!eventId.trim()) throw new Error("Select an event before loading volunteer tasks.");
    return apiRequest<VolunteerWorkspace>(`/volunteers/mine?eventId=${encodeURIComponent(eventId)}`);
  },

  updateTaskStatus(taskId: string, status: VolunteerTaskStatus): Promise<VolunteerTaskItem> {
    return apiRequest<VolunteerTaskItem>(`/volunteers/tasks/${encodeURIComponent(taskId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
