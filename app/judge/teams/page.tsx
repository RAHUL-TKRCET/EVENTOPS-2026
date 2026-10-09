"use client";

import React, { useState } from "react";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockTeams } from "@/lib/mock-data/teams";
import { mockJudges } from "@/lib/mock-data/judges";
import { Scale, CheckCircle2, Clock, ArrowRight, ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function JudgeAssignedTeamsPage() {
  const router = useRouter();
  const currentJudge = mockJudges[0];

  // Find teams assigned to this judge or related demo teams (like T001, T042)
  const assignedTeams = mockTeams.filter(
    (t) => currentJudge?.assignedTeams?.includes(t.id) || t.id === "T001" || t.id === "T042"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-amber-400 font-bold uppercase">
              Evaluator Terminal: {currentJudge?.id || "N/A"}
            </span>
            <StatusBadge status="ACTIVE" />
          </div>
          <h2 className="text-xl font-bold font-mono text-white mt-1">
            Assigned Teams for Evaluation — Round 1
          </h2>
          <p className="text-xs text-slate-400">
            Jury member: {currentJudge?.name || "Evaluator"} ({currentJudge?.organization || "Jury Panel"})
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/judge/history")}
        >
          Evaluation History
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Assigned Queue" value={assignedTeams.length} subtitle="Allocated by CP-SAT" icon={<Scale className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Completed Rubrics" value="2" subtitle="Scored & Locked" accentColor="emerald" icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Pending Assessment" value={assignedTeams.length - 2} subtitle="Awaiting pitch" accentColor="amber" icon={<Clock className="w-4 h-4 text-amber-400" />} />
      </div>

      <div className="space-y-3">
        {assignedTeams.map((team, idx) => {
          const isEvaluated = idx === 0 || idx === 1;

          return (
            <div
              key={team.id}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/60 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">{team.id}</span>
                  <span className="font-semibold text-slate-100">{team.name}</span>
                  <StatusBadge status={isEvaluated ? "SUBMITTED" : "PENDING"} />
                </div>
                <p className="text-xs text-slate-400 max-w-xl">{team.project.title}</p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Suite: <span className="text-slate-300 font-semibold">{team.assignedVenueName || team.assignedVenue}</span> • Bench: <span className="text-indigo-300 font-semibold">{team.assignedBench}</span> • Track: {team.project.domain}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {isEvaluated && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-mono block">Recorded Score</span>
                    <span className="text-base font-bold font-mono text-emerald-400">{team.totalScore || 96} / 100</span>
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
  );
}
