"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { mockJudges } from "@/lib/mock-data/judges";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Feedback";
import { ArrowLeft, Scale, AlertTriangle, ShieldCheck, Users, Clock } from "lucide-react";
import Link from "next/link";

export default function JudgeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const judgeId = params.judgeId as string;
  const judge = mockJudges.find((j) => j.id === judgeId) || mockJudges[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/judges"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-400">{judge.id}</span>
              <StatusBadge status={judge.workloadStatus} />
              <span className="text-xs text-slate-400">{judge.organization}</span>
            </div>
            <h2 className="text-xl font-bold font-mono text-white mt-1">{judge.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/judges/${judge.id}/availability`)}
          >
            Availability Slots
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => router.push(`/judges/${judge.id}/assignments`)}
          >
            Assigned Teams ({judge.assignedTeams.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Evaluator Profile & Expertise
            </h4>
            <div className="space-y-2">
              <p className="text-xs text-slate-300">
                <span className="text-slate-500 font-medium">Designation:</span> {judge.designation}
              </p>
              <p className="text-xs text-slate-300">
                <span className="text-slate-500 font-medium">Organization:</span> {judge.organization}
              </p>
              <p className="text-xs text-slate-300">
                <span className="text-slate-500 font-medium">Commitment:</span> {judge.availability}
              </p>
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                Recognized Domain Specializations
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {judge.expertise.map((exp) => (
                  <span
                    key={exp}
                    className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-800 text-slate-200 border border-slate-700"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {judge.conflicts.length > 0 && (
            <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Declared Conflict-of-Interest Hard Constraint</span>
              </div>
              <p className="text-xs text-amber-200/90">{judge.conflicts[0]}</p>
            </div>
          )}
        </div>

        {/* Workload Gauge Column */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Workload & Evaluation Saturation
          </h4>
          <div className="text-center py-4 space-y-2">
            <span className="text-4xl font-extrabold font-mono text-white">{judge.workload}%</span>
            <p className="text-xs text-slate-400">
              {judge.assignedTeams.length} of {judge.maxTeamCapacity} team slots filled
            </p>
            <ProgressBar value={judge.workload} color={judge.workload > 85 ? "rose" : "indigo"} />
          </div>
        </div>
      </div>
    </div>
  );
}
