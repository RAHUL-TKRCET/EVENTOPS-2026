import {
  HardConstraint,
  SoftConstraint,
  OptimizationConfig,
  OptimizationResults,
} from "@/types";
import {
  defaultHardConstraints,
  defaultSoftConstraints,
  defaultOptimizationConfig,
  mockOptimizationResults,
  mockAllocationMatrix,
} from "@/lib/mock-data/allocations";
import { mockTeams } from "@/lib/mock-data/teams";

let currentHardConstraints = [...defaultHardConstraints];
let currentSoftConstraints = [...defaultSoftConstraints];
let currentConfig = { ...defaultOptimizationConfig };
let currentResults = { ...mockOptimizationResults };

export const allocationApi = {
  async getRequirements() {
    await new Promise((r) => setTimeout(r, 150));
    return {
      totalEligibleTeams: 120,
      activeVenues: 24,
      totalBenches: 120,
      availableJudges: 20,
      timeSlotsCount: 4,
      domainBreakdown: {
        "AI / Machine Learning": 28,
        "Distributed Systems / Web3": 20,
        "FinTech & Payments": 18,
        "HealthTech & Bio": 16,
        "IoT & Robotics": 14,
        "CleanTech & Green Energy": 12,
        "CyberSecurity": 12,
      },
      hardwareDemands: {
        dedicatedHighPower: 18,
        isolatedRfSubnet: 8,
        dualMonitorPulpit: 24,
      },
    };
  },

  async getConstraints(): Promise<{ hard: HardConstraint[]; soft: SoftConstraint[] }> {
    await new Promise((r) => setTimeout(r, 150));
    return {
      hard: currentHardConstraints,
      soft: currentSoftConstraints,
    };
  },

  async updateHardConstraint(id: string, enabled: boolean): Promise<HardConstraint[]> {
    currentHardConstraints = currentHardConstraints.map((c) =>
      c.id === id ? { ...c, enabled } : c
    );
    return currentHardConstraints;
  },

  async updateSoftConstraint(id: string, weight: number, enabled?: boolean): Promise<SoftConstraint[]> {
    currentSoftConstraints = currentSoftConstraints.map((c) =>
      c.id === id ? { ...c, weight, enabled: enabled ?? c.enabled } : c
    );
    return currentSoftConstraints;
  },

  async getConfig(): Promise<OptimizationConfig> {
    await new Promise((r) => setTimeout(r, 100));
    return { ...currentConfig };
  },

  async updateConfig(cfg: Partial<OptimizationConfig>): Promise<OptimizationConfig> {
    currentConfig = { ...currentConfig, ...cfg };
    return { ...currentConfig };
  },

  async runOptimization(): Promise<OptimizationResults> {
    // Simulate CP-SAT execution delay
    await new Promise((r) => setTimeout(r, 1200));

    const simulatedResults: OptimizationResults = {
      ...mockOptimizationResults,
      runtimeMs: 1350 + Math.floor(Math.random() * 200),
      softConstraintSatisfactionPct: 97.4,
      overallScorePct: 98.6,
      matrix: [...mockAllocationMatrix],
    };
    currentResults = simulatedResults;
    return simulatedResults;
  },

  async getLatestResults(): Promise<OptimizationResults> {
    await new Promise((r) => setTimeout(r, 150));
    return currentResults;
  },

  async applyAllocation(): Promise<{ success: boolean; appliedCount: number }> {
    await new Promise((r) => setTimeout(r, 400));
    // Apply simulated allocations to mock teams
    currentResults.matrix.forEach((row) => {
      const team = mockTeams.find((t) => t.id === row.teamId);
      if (team) {
        team.assignedVenue = row.venueId;
        team.assignedVenueName = row.venueName;
        team.assignedBench = row.benchId;
        team.assignedJudges = row.judgeIds;
      }
    });
    return { success: true, appliedCount: currentResults.matrix.length };
  },

  async simulateWhatIf(scenario: "JUDGE_DROPOUT" | "VENUE_POWER_OUTAGE" | "EXTRA_TEAMS"): Promise<{
    impactSummary: string;
    affectedTeams: number;
    recommendedActions: string[];
    reOptimizationScore: number;
  }> {
    await new Promise((r) => setTimeout(r, 500));
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
};
