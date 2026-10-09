import { EventItem } from "@/types";
import { mockEvents } from "@/lib/mock-data/events";

export const eventsApi = {
  async getAll(): Promise<EventItem[]> {
    await new Promise((r) => setTimeout(r, 200));
    return [...mockEvents];
  },

  async getById(id: string): Promise<EventItem | undefined> {
    await new Promise((r) => setTimeout(r, 150));
    return mockEvents.find((e) => e.id === id) || mockEvents[0];
  },

  async create(data: Partial<EventItem>): Promise<EventItem> {
    await new Promise((r) => setTimeout(r, 350));
    const newEvent: EventItem = {
      id: `evt-${Date.now()}`,
      organizationId: data.organizationId || "org-01",
      name: data.name || "Untitled Enterprise Event",
      type: data.type || "Hackathon",
      description: data.description || "Operations enabled by EventOps.",
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date(Date.now() + 86400000 * 2).toISOString(),
      registrationDeadline: data.registrationDeadline || new Date().toISOString(),
      status: "DRAFT",
      expectedParticipants: data.expectedParticipants || 200,
      registeredTeamsCount: 0,
      currentRound: 1,
      totalRounds: data.totalRounds || 2,
      venuesCount: 0,
      judgesCount: 0,
      rounds: data.rounds || [
        {
          id: `rnd-1`,
          name: "Round 1 — Initial Evaluation",
          order: 1,
          status: "UPCOMING",
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000 * 4).toISOString(),
          qualifyingQuota: 20,
          criteria: [
            { id: "c1", name: "Technical Feasibility", maxScore: 25, weight: 0.25, description: "System architecture and execution" },
            { id: "c2", name: "Impact", maxScore: 25, weight: 0.25, description: "Market potential" },
          ],
        },
      ],
      timeSlots: data.timeSlots || [],
      rules: data.rules || [],
    };
    mockEvents.unshift(newEvent);
    return newEvent;
  },

  async update(id: string, updates: Partial<EventItem>): Promise<EventItem> {
    await new Promise((r) => setTimeout(r, 250));
    const idx = mockEvents.findIndex((e) => e.id === id);
    if (idx !== -1) {
      mockEvents[idx] = { ...mockEvents[idx], ...updates };
      return mockEvents[idx];
    }
    return mockEvents[0];
  },
};
