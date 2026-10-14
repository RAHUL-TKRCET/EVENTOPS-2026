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
  volunteerName?: string | null;
  volunteerRole?: string | null;
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

export interface VolunteerAssignment {
  id: string;
  eventId: string;
  userId: string | null;
  name: string;
  email: string;
  role: string;
  zone: string;
  status: string;
}

export interface CreateVolunteerTask {
  eventId: string;
  title: string;
  description?: string;
  zone?: string;
  volunteerId?: string;
  dueTime?: string;
}

export const volunteersApi = {
  getMine(eventId: string): Promise<VolunteerWorkspace> {
    if (!eventId.trim()) throw new Error("Select an event before loading volunteer tasks.");
    return apiRequest<VolunteerWorkspace>(`/volunteers/mine?eventId=${encodeURIComponent(eventId)}`);
  },

  getAssignments(eventId: string): Promise<VolunteerAssignment[]> {
    if (!eventId.trim()) throw new Error("Select an event before loading volunteer assignments.");
    return apiRequest<VolunteerAssignment[]>(`/volunteers?eventId=${encodeURIComponent(eventId)}`);
  },

  getTasks(eventId: string): Promise<VolunteerTaskItem[]> {
    if (!eventId.trim()) throw new Error("Select an event before loading volunteer tasks.");
    return apiRequest<VolunteerTaskItem[]>(`/volunteers/tasks?eventId=${encodeURIComponent(eventId)}`);
  },

  createTask(data: CreateVolunteerTask): Promise<VolunteerTaskItem> {
    return apiRequest<VolunteerTaskItem>("/volunteers/tasks", {
      method: "POST",
      body: JSON.stringify({
        eventId: data.eventId,
        title: data.title.trim(),
        ...(data.description?.trim() ? { description: data.description.trim() } : {}),
        ...(data.zone?.trim() ? { zone: data.zone.trim() } : {}),
        ...(data.volunteerId ? { volunteerId: data.volunteerId } : {}),
        ...(data.dueTime ? { dueTime: data.dueTime } : {}),
      }),
    });
  },

  updateTaskStatus(taskId: string, status: VolunteerTaskStatus): Promise<VolunteerTaskItem> {
    return apiRequest<VolunteerTaskItem>(`/volunteers/tasks/${encodeURIComponent(taskId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
