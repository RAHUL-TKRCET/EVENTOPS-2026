import {
  HardConstraint,
  SoftConstraint,
  OptimizationConfig,
  OptimizationResults,
  AllocationMatrixRow,
} from "@/types";

export const defaultHardConstraints: HardConstraint[] = [
  {
    id: "hc-01",
    name: "Zero Judge Double-Booking",
    description: "A judge cannot be scheduled to evaluate more than one team in the same time slot.",
    enabled: true,
    severity: "CRITICAL",
  },
  {
    id: "hc-02",
    name: "Room & Bench Exclusive Occupancy",
    description: "No two teams can occupy the same bench simultaneously.",
    enabled: true,
    severity: "CRITICAL",
  },
  {
    id: "hc-03",
    name: "Conflict of Interest Avoidance",
    description: "Strictly prohibit judges from evaluating teams with declared alumni, company, or mentorship ties.",
    enabled: true,
    severity: "CRITICAL",
  },
  {
    id: "hc-04",
    name: "Hard Hardware Prerequisite Matching",
    description: "Teams requiring dedicated 3-phase power or RF shielding must only be assigned to certified rooms.",
    enabled: true,
    severity: "CRITICAL",
  },
  {
    id: "hc-05",
    name: "Judge Maximum Evaluation Capacity",
    description: "No judge can be assigned more teams than their contractual max capacity limit.",
    enabled: true,
    severity: "CRITICAL",
  },
];

export const defaultSoftConstraints: SoftConstraint[] = [
  {
    id: "sc-01",
    name: "Domain Expertise Alignment",
    description: "Pair teams with evaluators having verified high semantic similarity to the project domain.",
    weight: 9,
    enabled: true,
  },
  {
    id: "sc-02",
    name: "Balanced Judge Workload Distribution",
    description: "Minimize standard deviation of assigned teams across all available judges (target σ < 0.8).",
    weight: 8,
    enabled: true,
  },
  {
    id: "sc-03",
    name: "Venue Proximity Clustered by Domain",
    description: "Cluster teams of similar technical tracks into adjacent rooms for smoother judge transit.",
    weight: 7,
    enabled: true,
  },
  {
    id: "sc-04",
    name: "Consecutive Slot Minimization (Judge Fatigue)",
    description: "Provide at least one 15-minute buffer between successive deep evaluations.",
    weight: 6,
    enabled: true,
  },
];

export const defaultOptimizationConfig: OptimizationConfig = {
  algorithm: "CP-SAT",
  maxRuntimeSeconds: 15,
  balanceJudgeWorkloadWeight: 8,
  domainMatchWeight: 9,
  consecutiveSlotWeight: 6,
  venueProximityWeight: 7,
};

export const mockAllocationMatrix: AllocationMatrixRow[] = [];
export const mockOptimizationResults: OptimizationResults | null = null;
