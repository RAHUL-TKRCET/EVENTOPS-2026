import { EvaluationItem } from "@/types";
import { mockEvaluations } from "@/lib/mock-data/evaluations";
import { mockTeams } from "@/lib/mock-data/teams";

export const evaluationApi = {
  async getByJudge(judgeId: string): Promise<EvaluationItem[]> {
    await new Promise((r) => setTimeout(r, 200));
    return mockEvaluations.filter((e) => e.judgeId === judgeId);
  },

  async getByTeam(teamId: string): Promise<EvaluationItem[]> {
    await new Promise((r) => setTimeout(r, 200));
    return mockEvaluations.filter((e) => e.teamId === teamId);
  },

  async submitEvaluation(data: Partial<EvaluationItem>): Promise<EvaluationItem> {
    await new Promise((r) => setTimeout(r, 300));
    const evalId = `eval-${Date.now()}`;
    const newEval: EvaluationItem = {
      id: evalId,
      eventId: data.eventId || "evt-01",
      roundId: data.roundId || "rnd-01",
      judgeId: data.judgeId || "J001",
      teamId: data.teamId || "T001",
      scores: data.scores || {},
      totalScore: Object.values(data.scores || {}).reduce((a, b) => a + b, 0),
      feedback: data.feedback || "",
      strengths: data.strengths || "",
      areasToImprove: data.areasToImprove || "",
      status: "SUBMITTED",
      submittedAt: new Date().toISOString(),
    };
    const existingIdx = mockEvaluations.findIndex(
      (e) => e.teamId === newEval.teamId && e.judgeId === newEval.judgeId
    );
    if (existingIdx !== -1) {
      mockEvaluations[existingIdx] = newEval;
    } else {
      mockEvaluations.push(newEval);
    }

    // Update team score
    const team = mockTeams.find((t) => t.id === newEval.teamId);
    if (team) {
      team.totalScore = newEval.totalScore;
    }

    return newEval;
  },
};
