import { EvaluationItem } from "@/types";
import { apiRequest } from "./config";

export const evaluationApi = {
  async getByTeam(teamId: string): Promise<EvaluationItem[]> {
    return apiRequest<EvaluationItem[]>(`/evaluation/team/${encodeURIComponent(teamId)}`);
  },

  async getMine(teamId: string, roundId: string): Promise<EvaluationItem | null> {
    const query = new URLSearchParams({ roundId });
    return apiRequest<EvaluationItem | null>(
      `/evaluation/team/${encodeURIComponent(teamId)}/mine?${query.toString()}`
    );
  },

  async submitEvaluation(data: {
    eventId: string;
    roundId: string;
    teamId: string;
    scores: Record<string, number>;
    feedback?: string;
    strengths?: string;
    areasToImprove?: string;
    status?: EvaluationItem["status"];
  }): Promise<EvaluationItem> {
    return apiRequest<EvaluationItem>("/evaluation", {
      method: "POST",
      body: JSON.stringify({
        eventId: data.eventId,
        roundId: data.roundId,
        teamId: data.teamId,
        scores: data.scores,
        feedback: data.feedback ?? "",
        strengths: data.strengths ?? "",
        areasToImprove: data.areasToImprove ?? "",
        status: data.status ?? "SUBMITTED",
      }),
    });
  },

  async getLeaderboard(eventId: string): Promise<any[]> {
    return apiRequest<any[]>(`/evaluation/leaderboard/${encodeURIComponent(eventId)}`);
  },
};
