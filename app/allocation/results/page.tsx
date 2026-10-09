"use client";

import React, { useState } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { allocationApi } from "@/lib/api/allocation";
import { mockAllocationMatrix, mockOptimizationResults } from "@/lib/mock-data/allocations";
import { AllocationMatrixRow, OptimizationResults } from "@/types";
import { CheckCircle2, ShieldCheck, Cpu, ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AllocationResultsPage() {
  const router = useRouter();
  const [matrix, setMatrix] = useState<AllocationMatrixRow[]>(mockAllocationMatrix);
  const [results, setResults] = useState<OptimizationResults>(
    mockOptimizationResults || {
      totalTeamsAllocated: 0,
      unallocatedTeamsCount: 0,
      hardConstraintViolations: 0,
      softConstraintSatisfactionPct: 100,
      overallScorePct: 98,
      judgeWorkloadStandardDeviation: 0.4,
      venueUtilizationPct: 85,
      runtimeMs: 420,
      matrix: [],
      conflicts: [],
      aiInsights: ["Awaiting new solver run or initial optimization data."],
    }
  );
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    await allocationApi.applyAllocation();
    setIsApplying(false);
    setIsApplied(true);
  };

  const columns: Column<AllocationMatrixRow>[] = [
    {
      key: "teamId",
      header: "Team ID",
      sortable: true,
      className: "w-20 font-mono font-bold text-indigo-400",
    },
    {
      key: "teamName",
      header: "Team & Domain",
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-100">{r.teamName}</div>
          <div className="text-[11px] text-slate-500 font-mono">{r.domain}</div>
        </div>
      ),
    },
    {
      key: "venueName",
      header: "Allocated Room & Bench",
      render: (r) => (
        <div>
          <div className="text-slate-200">{r.venueName}</div>
          <div className="font-mono text-xs text-indigo-400 font-bold">{r.benchLabel}</div>
        </div>
      ),
    },
    {
      key: "judgeNames",
      header: "Assigned Jury Panel",
      render: (r) => (
        <div className="text-xs space-y-0.5">
          {r.judgeNames.map((jn, i) => (
            <div key={i} className="text-slate-300 font-medium">
              {jn}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "timeSlot",
      header: "Scheduled Slot",
      sortable: true,
      render: (r) => <span className="font-mono text-xs text-slate-300">{r.timeSlot}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "score",
      header: "Affinity Score",
      sortable: true,
      render: (r) => (
        <span className="font-mono font-bold text-xs text-emerald-400">
          {r.score}%
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/allocation/optimization"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="font-mono text-xs text-indigo-400 font-bold uppercase">
              Step 5 & 6 of 5: Optimization Matrix Results
            </span>
            <h2 className="text-xl font-bold font-mono text-white mt-0.5">
              Verified Optimal Allocation Matrix
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push("/allocation/what-if")}
          >
            What-If Labs
          </Button>

          <Button
            variant={isApplied ? "success" : "primary"}
            size="md"
            isLoading={isApplying}
            onClick={handleApply}
            leftIcon={isApplied ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          >
            {isApplied ? "Allocation Active & Applied ✓" : "Approve & Deploy Allocation"}
          </Button>
        </div>
      </div>

      {/* Solver Score KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Hard Violations" value="0" subtitle="100% Valid" accentColor="emerald" icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Satisfaction" value={`${results.softConstraintSatisfactionPct}%`} subtitle="Soft Objectives" accentColor="indigo" icon={<Cpu className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Overall Score" value={`${results.overallScorePct}%`} subtitle="Match Quality" accentColor="violet" icon={<Sparkles className="w-4 h-4 text-violet-400" />} />
        <KPICard title="Jury Balance (σ)" value={`σ = ${results.judgeWorkloadStandardDeviation}`} subtitle="Target < 0.8" accentColor="sky" />
        <KPICard title="Venue Utilization" value={`${results.venueUtilizationPct}%`} subtitle="120 Benches" accentColor="amber" />
        <KPICard title="Solve Latency" value={`${results.runtimeMs}ms`} subtitle="CP-SAT Execution" accentColor="emerald" />
      </div>

      {/* AI Solver Insights Snippet */}
      <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold font-mono">
          <Sparkles className="w-4 h-4" />
          <span>Solver Insights & Resolution Audit</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-300">
          {results.aiInsights.map((ins, i) => (
            <li key={i}>{ins}</li>
          ))}
        </ul>
      </div>

      {/* Main Allocation Matrix Table */}
      <DataTable
        data={matrix}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchPlaceholder="Filter allocation by team, bench, or judge..."
        searchFilter={(r, q) =>
          r.teamName.toLowerCase().includes(q) ||
          r.teamId.toLowerCase().includes(q) ||
          r.benchLabel.toLowerCase().includes(q) ||
          r.judgeNames.some((j) => j.toLowerCase().includes(q))
        }
      />
    </div>
  );
}
