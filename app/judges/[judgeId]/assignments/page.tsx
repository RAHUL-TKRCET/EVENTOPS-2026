"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { mockJudges } from "@/lib/mock-data/judges";
import { mockTeams } from "@/lib/mock-data/teams";
import { ArrowLeft, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function JudgeAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const judgeId = params.judgeId as string;
  const judge = mockJudges.find((j) => j.id === judgeId) || mockJudges[0];

  const assignedTeamDetails = mockTeams.filter((t) => judge?.assignedTeams?.includes(t.id));

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={judge ? `/judges/${judge.id}` : "/judges"}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Assigned Evaluation Queue: {judge.name}</h2>
          <p className="text-xs text-slate-400">
            {assignedTeamDetails.length} teams routed by OR-Tools CP-SAT scheduler.
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden">
        {assignedTeamDetails.map((team) => (
          <div key={team.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-800/40 transition">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-indigo-400">{team.id}</span>
                <span className="font-semibold text-slate-100">{team.name}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {team.project.title} • {team.assignedVenueName || team.assignedVenue} ({team.assignedBench})
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/judge/evaluation/${team.id}`)}
              rightIcon={<ExternalLink className="w-3 h-3" />}
            >
              Open Rubric
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
