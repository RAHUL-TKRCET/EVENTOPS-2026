"use client";

import React, { useEffect, useState } from "react";
import { JudgeWorkloadCard } from "@/components/ui/Cards";
import { KPICard } from "@/components/ui/KPICard";
import { Button } from "@/components/ui/Button";
import { Judge } from "@/types";
import { Scale, Plus, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { judgesApi } from "@/lib/api/judges";

export default function JudgesListPage() {
  const router = useRouter();
  const [judges, setJudges] = useState<Judge[]>([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadJudges = async () => {
    setIsLoading(true);
    setError("");
    try {
      setJudges(await judgesApi.getAll());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load judges.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadJudges(); }, []);

  const availableCount = judges.filter((j) => j.workloadStatus === "AVAILABLE").length;
  const busyCount = judges.filter((j) => j.workloadStatus === "BUSY").length;
  const overloadedCount = judges.filter((j) => j.workloadStatus === "OVERLOADED").length;
  const filteredJudges = filterStatus === "ALL" ? judges : judges.filter((j) => j.workloadStatus === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Judges & enrollment</h2>
          <p className="text-sm text-slate-400">Manage judges and their event assignments. Email delivery is reported only when configured.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="md" onClick={() => void loadJudges()} leftIcon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={() => router.push("/judges/create")}>Enroll judge</Button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Enrolled judges" value={judges.length} icon={<Scale className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Available" value={availableCount} accentColor="emerald" icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Busy / overloaded" value={busyCount + overloadedCount} accentColor="amber" icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", "AVAILABLE", "BUSY", "OVERLOADED", "UNAVAILABLE"].map((status) => (
          <button key={status} onClick={() => setFilterStatus(status)}
            className={`rounded-lg px-3 py-1.5 text-xs font-mono transition ${filterStatus === status ? "bg-indigo-600 text-white font-bold" : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"}`}>
            {status} ({status === "ALL" ? judges.length : judges.filter((j) => j.workloadStatus === status).length})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-800 p-8 text-center text-sm text-slate-400">Loading organization judges…</div>
      ) : filteredJudges.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 p-8 text-center">
          <Scale className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          <h3 className="font-semibold text-white">No judges found</h3>
          <p className="mt-1 text-sm text-slate-400">Enroll a judge for one of your organization's events to see them here.</p>
          <Button className="mt-4" variant="primary" onClick={() => router.push("/judges/create")}>Enroll first judge</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredJudges.map((judge) => (
            <JudgeWorkloadCard key={judge.id} judge={judge} onSelect={(j) => router.push(`/judges/${j.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
