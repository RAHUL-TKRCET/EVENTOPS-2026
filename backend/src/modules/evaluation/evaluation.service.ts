import { inMemoryTeams } from "../teams/teams.service";

export interface EvaluationRecord {
  id: string;
  eventId: string;
  roundId: string;
  judgeId: string;
  judgeName?: string;
  teamId: string;
  scores: Record<string, number>;
  totalScore: number;
  feedback: string;
  strengths: string;
  areasToImprove: string;
  status: "SUBMITTED" | "VERIFIED";
  submittedAt: string;
}

export const inMemoryEvaluations: EvaluationRecord[] = [
  {
    id: "eval-01",
    eventId: "evt-01",
    roundId: "rnd-01",
    judgeId: "J001",
    judgeName: "Dr. Marcus Vance",
    teamId: "T001",
    scores: { c1: 22, c2: 21, c3: 20, c4: 21.5 },
    totalScore: 84.5,
    feedback: "Exceptional firmware architecture and signal filtering on ESP32.",
    strengths: "Real-time edge performance and low latency.",
    areasToImprove: "Prepare comprehensive clinical benchmark validation.",
    status: "SUBMITTED",
    submittedAt: "2026-10-15T16:30:00Z",
  },
  {
    id: "eval-02",
    eventId: "evt-01",
    roundId: "rnd-01",
    judgeId: "J002",
    judgeName: "Dr. Rachel Chen",
    teamId: "T002",
    scores: { c1: 20, c2: 20, c3: 19, c4: 20 },
    totalScore: 79.0,
    feedback: "High-grade cryptographic implementation with clean Rust concurrency.",
    strengths: "Rigorous threat model and proof-of-concept tests.",
    areasToImprove: "GUI / operator telemetry interface could be cleaner.",
    status: "SUBMITTED",
    submittedAt: "2026-10-15T16:45:00Z",
  },
];

export class EvaluationService {
  public static getByJudge(judgeId: string) {
    return inMemoryEvaluations.filter((e) => e.judgeId === judgeId);
  }

  public static getByTeam(teamId: string) {
    return inMemoryEvaluations.filter((e) => e.teamId === teamId);
  }

  public static submit(data: {
    eventId: string;
    roundId: string;
    judgeId: string;
    judgeName?: string;
    teamId: string;
    scores: Record<string, number>;
    feedback?: string;
    strengths?: string;
    areasToImprove?: string;
  }) {
    const totalScore = Object.values(data.scores).reduce((sum, val) => sum + Number(val || 0), 0);

    const record: EvaluationRecord = {
      id: `eval-${Date.now()}`,
      eventId: data.eventId,
      roundId: data.roundId,
      judgeId: data.judgeId,
      judgeName: data.judgeName || "Assigned Jury Member",
      teamId: data.teamId,
      scores: data.scores,
      totalScore,
      feedback: data.feedback || "",
      strengths: data.strengths || "",
      areasToImprove: data.areasToImprove || "",
      status: "SUBMITTED",
      submittedAt: new Date().toISOString(),
    };

    const existingIdx = inMemoryEvaluations.findIndex(
      (e) => e.roundId === data.roundId && e.judgeId === data.judgeId && e.teamId === data.teamId
    );

    if (existingIdx !== -1) {
      inMemoryEvaluations[existingIdx] = record;
    } else {
      inMemoryEvaluations.push(record);
    }

    // Recalculate average team score
    const teamEvals = inMemoryEvaluations.filter((e) => e.teamId === data.teamId);
    const avgScore = teamEvals.reduce((acc, curr) => acc + curr.totalScore, 0) / teamEvals.length;
    const team = inMemoryTeams.find((t) => t.id === data.teamId);
    if (team) {
      team.totalScore = Math.round(avgScore * 100) / 100;
    }

    return record;
  }

  public static getLeaderboard(eventId: string, roundId?: string) {
    const teams = inMemoryTeams.filter((t) => t.eventId === eventId);
    return [...teams]
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .map((t, idx) => ({
        rank: idx + 1,
        teamId: t.id,
        teamName: t.name,
        leadName: t.leadName,
        projectTitle: t.project.title,
        domain: t.project.domain,
        totalScore: t.totalScore || 0,
        evaluationsCount: inMemoryEvaluations.filter((e) => e.teamId === t.id).length,
      }));
  }
}
