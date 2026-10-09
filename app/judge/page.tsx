"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockTeams } from "@/lib/mock-data/teams";
import { mockJudges } from "@/lib/mock-data/judges";
import {
  Scale,
  CheckCircle2,
  Clock,
  ArrowRight,
  ClipboardCheck,
  QrCode,
  ShieldCheck,
  Sparkles,
  MapPin,
  Lock,
} from "lucide-react";

export default function JudgeDashboardPage() {
  const router = useRouter();
  const currentJudge = mockJudges[0];

  // Scoped to teams assigned to this judge
  const assignedTeams = mockTeams.filter(
    (t) => currentJudge?.assignedTeams?.includes(t.id) || t.id === "T042" || t.id === "T001"
  );

  const completedCount = Math.min(2, assignedTeams.length);
  const pendingCount = Math.max(0, assignedTeams.length - completedCount);
  const progressPct = assignedTeams.length > 0 ? Math.round((completedCount / assignedTeams.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Judge Header */}
      <div className="p-6 rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Evaluator Terminal • {currentJudge?.id || "N/A"}
            </span>
            <StatusBadge status="ACTIVE" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            Welcome, {currentJudge?.name || "Evaluator"}
          </h1>
          <p className="text-xs text-slate-400">
            {currentJudge?.organization || "Jury Panel"} • Specialization: {currentJudge?.expertise?.join(", ") || "General"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<QrCode className="w-4 h-4 text-indigo-400" />}
            onClick={() => router.push("/attendance/scanner")}
          >
            Verify Team QR
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<ClipboardCheck className="w-4 h-4" />}
            onClick={() => router.push(`/judge/evaluation/${assignedTeams[0]?.id || "T042"}`)}
          >
            Start Next Rubric
          </Button>
        </div>
      </div>

      {/* Role Scoping Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Jury Data Scoping Active: You have visibility only over your <strong className="text-white">{assignedTeams.length} allocated teams</strong>. Other judges' private scoring sheets and global optimization rules are locked.
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500 shrink-0">ISO-27001 JURY COMPLIANT</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard
          title="Assigned Queue"
          value={assignedTeams.length}
          subtitle="Allocated by CP-SAT"
          icon={<Scale className="w-4 h-4 text-indigo-400" />}
        />
        <KPICard
          title="Evaluations Completed"
          value={completedCount}
          accentColor="emerald"
          subtitle={`${progressPct}% Progress`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <KPICard
          title="Pending Assessment"
          value={pendingCount}
          accentColor="amber"
          subtitle="Awaiting pitch evaluation"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
        />
        <KPICard
          title="Average Score Given"
          value="95.5 / 100"
          subtitle="Consensus Index"
          accentColor="violet"
          icon={<Sparkles className="w-4 h-4 text-purple-400" />}
        />
      </div>

      {/* Progress Bar */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-300 font-semibold">Evaluation Completion Progress</span>
          <span className="text-indigo-400 font-bold">{completedCount} of {assignedTeams.length} Teams Scored</span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Assigned Teams Table/Queue */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Assigned Teams Floor Queue
            </h3>
            <p className="text-xs text-slate-400">
              Visit assigned workstations in Turing Hall or call teams to presentation room
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/judge/teams")}
          >
            View All Assigned Teams →
          </Button>
        </div>

        <div className="space-y-3">
          {assignedTeams.map((team, idx) => {
            const isEvaluated = idx === 0 || idx === 1;

            return (
              <div
                key={team.id}
                className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">{team.id}</span>
                    <span className="font-semibold text-slate-100 text-sm">{team.name}</span>
                    <StatusBadge status={isEvaluated ? "SUBMITTED" : "PENDING"} />
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl">{team.project.title}</p>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {team.assignedVenueName || team.assignedVenue}
                    </span>
                    <span>Bench: <strong className="text-indigo-300">{team.assignedBench}</strong></span>
                    <span>Track: {team.project.domain}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isEvaluated && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-mono block">Recorded Score</span>
                      <span className="text-sm font-bold font-mono text-emerald-400">{team.totalScore || 96.5} / 100</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant={isEvaluated ? "outline" : "primary"}
                    onClick={() => router.push(`/judge/evaluation/${team.id}`)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    {isEvaluated ? "Review Rubric" : "Start Evaluation"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
