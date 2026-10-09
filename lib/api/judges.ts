import { Judge, JudgeWorkloadStatus } from "@/types";
import { mockJudges } from "@/lib/mock-data/judges";

export const judgesApi = {
  async getAll(eventId = "evt-01"): Promise<Judge[]> {
    await new Promise((r) => setTimeout(r, 200));
    return mockJudges.filter((j) => !eventId || j.eventId === eventId);
  },

  async getById(id: string): Promise<Judge | undefined> {
    await new Promise((r) => setTimeout(r, 150));
    return mockJudges.find((j) => j.id === id);
  },

  async create(data: Partial<Judge>): Promise<Judge> {
    await new Promise((r) => setTimeout(r, 300));
    const newId = `J${(mockJudges.length + 1).toString().padStart(3, "0")}`;
    const newJudge: Judge = {
      id: newId,
      eventId: data.eventId || "evt-01",
      name: data.name || "Dr. Guest Evaluator",
      organization: data.organization || "Independent Tech Council",
      designation: data.designation || "Senior Technical Advisor",
      expertise: data.expertise || ["AI / Machine Learning"],
      domains: data.domains || ["AI / Machine Learning"],
      assignedTeams: [],
      maxTeamCapacity: data.maxTeamCapacity || 8,
      availability: data.availability || "FULL_TIME",
      availableSlots: ["Slot A", "Slot B"],
      workload: 0,
      workloadStatus: "AVAILABLE",
      conflicts: [],
    };
    mockJudges.push(newJudge);
    return newJudge;
  },

  async updateStatus(judgeId: string, status: JudgeWorkloadStatus): Promise<Judge> {
    await new Promise((r) => setTimeout(r, 150));
    const judge = mockJudges.find((j) => j.id === judgeId);
    if (judge) {
      judge.workloadStatus = status;
      return { ...judge };
    }
    throw new Error("Judge not found");
  },
};
