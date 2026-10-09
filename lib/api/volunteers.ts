import { Volunteer, VolunteerTask, TaskStatus } from "@/types";
import { mockVolunteers, mockVolunteerTasks } from "@/lib/mock-data/volunteers";

export const volunteersApi = {
  async getAll(eventId = "evt-01"): Promise<Volunteer[]> {
    await new Promise((r) => setTimeout(r, 150));
    return mockVolunteers.filter((v) => !eventId || v.eventId === eventId);
  },

  async getTasks(eventId = "evt-01"): Promise<VolunteerTask[]> {
    await new Promise((r) => setTimeout(r, 150));
    return [...mockVolunteerTasks];
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<VolunteerTask> {
    await new Promise((r) => setTimeout(r, 150));
    const task = mockVolunteerTasks.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      return { ...task };
    }
    throw new Error("Task not found");
  },

  async createTask(data: Partial<VolunteerTask>): Promise<VolunteerTask> {
    await new Promise((r) => setTimeout(r, 200));
    const newTask: VolunteerTask = {
      id: `tsk-${Date.now()}`,
      title: data.title || "New Operations Task",
      description: data.description || "",
      zone: data.zone || "Main Hall",
      priority: data.priority || "MEDIUM",
      status: "ASSIGNED",
      assignedVolunteerId: data.assignedVolunteerId || mockVolunteers[0].id,
      assignedVolunteerName: data.assignedVolunteerName || mockVolunteers[0].name,
      dueTime: data.dueTime || "Next 30 mins",
    };
    mockVolunteerTasks.unshift(newTask);
    return newTask;
  },
};
