import { Incident, IncidentStatus, IncidentPriority } from "@/types";
import { mockIncidents } from "@/lib/mock-data/incidents";

export const incidentsApi = {
  async getAll(eventId = "evt-01"): Promise<Incident[]> {
    await new Promise((r) => setTimeout(r, 150));
    return mockIncidents.filter((inc) => !eventId || inc.eventId === eventId);
  },

  async getById(id: string): Promise<Incident | undefined> {
    await new Promise((r) => setTimeout(r, 100));
    return mockIncidents.find((inc) => inc.id === id);
  },

  async create(data: Partial<Incident>): Promise<Incident> {
    await new Promise((r) => setTimeout(r, 250));
    const newInc: Incident = {
      id: `INC-${2044 + Math.floor(Math.random() * 100)}`,
      eventId: data.eventId || "evt-01",
      title: data.title || "Unclassified Incident",
      category: data.category || "OTHER",
      priority: data.priority || "MEDIUM",
      status: "OPEN",
      reportedBy: data.reportedBy || "Control Center",
      location: data.location || "General Venue",
      assignedTo: data.assignedTo,
      description: data.description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockIncidents.unshift(newInc);
    return newInc;
  },

  async updateStatus(id: string, status: IncidentStatus, notes?: string): Promise<Incident> {
    await new Promise((r) => setTimeout(r, 200));
    const inc = mockIncidents.find((i) => i.id === id);
    if (inc) {
      inc.status = status;
      inc.updatedAt = new Date().toISOString();
      if (status === "RESOLVED") {
        inc.resolvedAt = new Date().toISOString();
        if (notes) inc.resolutionNotes = notes;
      }
      return { ...inc };
    }
    throw new Error("Incident not found");
  },
};
