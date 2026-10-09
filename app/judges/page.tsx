"use client";

import React, { useState } from "react";
import { JudgeWorkloadCard } from "@/components/ui/Cards";
import { KPICard } from "@/components/ui/KPICard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { mockJudges } from "@/lib/mock-data/judges";
import { Judge } from "@/types";
import { Scale, Plus, AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function JudgesListPage() {
  const router = useRouter();
  const [judges, setJudges] = useState<Judge[]>(mockJudges);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const availableCount = judges.filter((j) => j.workloadStatus === "AVAILABLE").length;
  const busyCount = judges.filter((j) => j.workloadStatus === "BUSY").length;
  const overloadedCount = judges.filter((j) => j.workloadStatus === "OVERLOADED").length;
  const conflictCount = judges.filter((j) => j.conflicts.length > 0).length;

  const filteredJudges = filterStatus === "ALL"
    ? judges
    : judges.filter((j) => j.workloadStatus === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Jury Panel & Evaluator Operations</h2>
          <p className="text-xs text-slate-400">
            Workload balancing, domain expertise matching, and conflict-of-interest telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push("/allocation/optimization")}
          >
            Balance Workload (CP-SAT)
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => router.push("/judges/create")}
          >
            Add Evaluator
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard title="Total Evaluators" value={judges.length} subtitle="20 Accredited Experts" icon={<Scale className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Available Capacity" value={availableCount} subtitle="Target σ < 0.8" accentColor="emerald" icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="High Load / Busy" value={busyCount} subtitle="70-85% capacity" accentColor="amber" icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} />
        <KPICard
          title="Overloaded"
          value={overloadedCount}
          subtitle="J007 & J012 flagged"
          accentColor="rose"
          change="Action Required"
          changeType="negative"
          icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", "AVAILABLE", "BUSY", "OVERLOADED", "UNAVAILABLE"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
              filterStatus === status
                ? "bg-indigo-600 text-white font-bold"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {status} ({status === "ALL" ? judges.length : judges.filter((j) => j.workloadStatus === status).length})
          </button>
        ))}
      </div>

      {/* Workload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredJudges.map((judge) => (
          <JudgeWorkloadCard
            key={judge.id}
            judge={judge}
            onSelect={(j) => router.push(`/judges/${j.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
