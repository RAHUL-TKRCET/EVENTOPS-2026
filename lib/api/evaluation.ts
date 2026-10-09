import { EvaluationItem } from "@/types";
import { apiRequest } from "./config";

export const evaluationApi = {
  async getByTeam(teamId: string): Promise<EvaluationItem[]> {
    return apiRequest<EvaluationItem[]>(`/evaluation/team/${teamId}`);
  },

  async submitEvaluation(data: Partial<EvaluationItem>): Promise<EvaluationItem> {
    return apiRequest<EvaluationItem>("/evaluation", {
      method: "POST",
      body: JSON.stringify({
        eventId: data.eventId || "evt-01",
        roundId: data.roundId || "rnd-1",
        teamId: data.teamId,
        scores: data.scores || {},
        feedback: data.feedback || "",
        strengths: data.strengths || "",
        areasToImprove: data.areasToImprove || "",
        status: data.status || "SUBMITTED",
      }),
    });
  },

  async getLeaderboard(eventId = "evt-01"): Promise<any[]> {
    return apiRequest<any[]>(`/evaluation/leaderboard/${eventId}`);
  },
};
