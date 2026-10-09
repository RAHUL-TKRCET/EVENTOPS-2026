"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { mockTeams } from "@/lib/mock-data/teams";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { ArrowLeft, ArrowRight, Code2, Users, Building, Trophy } from "lucide-react";
import Link from "next/link";

export default function JudgeTeamProfilePage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const team = mockTeams.find((t) => t.id === teamId) || mockTeams[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/judge/teams"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="font-mono text-xs text-amber-400 font-bold uppercase">
            Jury Review Briefing
          </span>
          <h2 className="text-xl font-bold font-mono text-white mt-0.5">
            {team.name} ({team.id})
          </h2>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="font-mono text-xs text-indigo-400 font-bold">{team.project.domain}</span>
          <StatusBadge status={team.checkInStatus} />
        </div>

        <h3 className="text-base font-semibold text-slate-100">{team.project.title}</h3>
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          {team.project.abstract}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 text-[11px]">Room Suite</span>
            <p className="font-semibold text-slate-200">{team.assignedVenueName || team.assignedVenue}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 text-[11px]">Bench Position</span>
            <p className="font-mono font-bold text-indigo-400">{team.assignedBench}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 text-[11px]">Team Captain</span>
            <p className="font-semibold text-slate-200">{team.leadName}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 text-[11px]">Team Size</span>
            <p className="font-semibold text-slate-200">{team.members.length} Hackers</p>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-slate-800">
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push(`/judge/evaluation/${team.id}`)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Open Evaluation Rubric Scoring
          </Button>
        </div>
      </div>
    </div>
  );
}
