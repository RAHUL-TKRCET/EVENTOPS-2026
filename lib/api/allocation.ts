import {
  HardConstraint,
  SoftConstraint,
  OptimizationConfig,
  OptimizationResults,
} from "@/types";
import { apiRequest } from "./config";

export const allocationApi = {
  async getRequirements(eventId = "evt-01") {
    return apiRequest(`/allocation/requirements?eventId=${encodeURIComponent(eventId)}`);
  },

  async getConstraints(eventId = "evt-01"): Promise<{ hard: HardConstraint[]; soft: SoftConstraint[] }> {
    return apiRequest<{ hard: HardConstraint[]; soft: SoftConstraint[] }>(`/allocation/constraints?eventId=${encodeURIComponent(eventId)}`);
  },

  async runOptimization(params: {
    eventId?: string;
    roundId?: string;
    enforcePowerSafety?: boolean;
    balanceJudgeWorkload?: boolean;
  } = {}): Promise<OptimizationResults> {
    return apiRequest<OptimizationResults>("/allocation/solve", {
      method: "POST",
      body: JSON.stringify({
        eventId: params.eventId || "evt-01",
        roundId: params.roundId || "rnd-1",
        enforcePowerSafety: params.enforcePowerSafety ?? true,
        balanceJudgeWorkload: params.balanceJudgeWorkload ?? true,
      }),
    });
  },

  async getLatestResults(): Promise<OptimizationResults> {
    return this.runOptimization();
  },

  async applyAllocation(): Promise<{ success: boolean; appliedCount: number }> {
    return { success: true, appliedCount: 5 };
  },

  async simulateWhatIf(scenario: "JUDGE_DROPOUT" | "VENUE_POWER_OUTAGE" | "EXTRA_TEAMS"): Promise<{
    impactSummary: string;
    affectedTeams: number;
    recommendedActions: string[];
    reOptimizationScore: number;
  }> {
    if (scenario === "JUDGE_DROPOUT") {
      return {
        impactSummary: "Judge J007 unavailable for Slot B: 6 teams affected across Room 204.",
        affectedTeams: 6,
        recommendedActions: [
          "Auto-reassign J010 (Standby Judge, BioGenomics background)",
          "Shift 2 evaluations to Slot C buffer window",
        ],
        reOptimizationScore: 96.2,
      };
    } else if (scenario === "VENUE_POWER_OUTAGE") {
      return {
        impactSummary: "Room R002 breaker trip: 5 benches unpowered.",
        affectedTeams: 5,
        recommendedActions: [
          "Evacuate teams to standby Room R024 (Ada Lovelace Floor 4)",
          "Sync digital judges to new room location via notification",
        ],
        reOptimizationScore: 94.8,
      };
    }
    return {
      impactSummary: "Adding 10 wildcard waitlisted teams exceeds current bench capacity.",
      affectedTeams: 10,
      recommendedActions: ["Activate standby Room R023 & R024", "Extend evaluation rounds by 1 time slot"],
      reOptimizationScore: 95.1,
    };
  },

  async parsePrompt(prompt: string) {
    return apiRequest("/allocation/parse-prompt", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
  },
};
