"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { useAssignedJudgeTeam } from "@/hooks/useAssignedJudgeTeams";
import { ArrowLeft, ArrowRight, Building, Users } from "lucide-react";

export default function JudgeTeamProfilePage() {
  const params = useParams();
  const router = useRouter();
  const teamId = String(params.teamId || "");
  const { team, isLoading, error } = useAssignedJudgeTeam(teamId);

  if (isLoading) {
    return (
      <div role="status" className="max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
        Loading team details from the event service…
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-4xl mx-auto rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 space-y-3">
        <h1 className="text-lg font-semibold text-rose-200">Team details unavailable</h1>
        <p role="alert" className="text-xs leading-relaxed text-rose-100/80">
          {error || "The event service did not return this assigned team."}
        </p>
        <p className="text-xs text-slate-400">No sample team is substituted when the requested team cannot be verified.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/judge/teams")}>
          Back to Assigned Teams
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/judge/teams"
          aria-label="Back to assigned teams"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="font-mono text-xs text-amber-400 font-bold uppercase">Assigned Team Briefing</span>
          <h1 className="text-xl font-bold font-mono text-white mt-0.5">{team.name} ({team.id})</h1>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <span className="font-mono text-xs text-indigo-400 font-bold">{team.project.domain || "Domain not specified"}</span>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            Check-in status
            <StatusBadge status={team.checkInStatus} />
          </div>
        </div>

        <h2 className="text-base font-semibold text-slate-100">{team.project.title || "Project title not provided"}</h2>
        <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs leading-relaxed text-slate-300">
          {team.project.abstract || "No project abstract has been provided."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Building className="w-3.5 h-3.5" /> Room / Venue
            </div>
            <p className="mt-1 font-semibold text-slate-200">{team.assignedVenueName || team.assignedVenue || "Not allocated"}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Building className="w-3.5 h-3.5" /> Bench
            </div>
            <p className="mt-1 font-mono font-bold text-indigo-400">{team.assignedBench || "Not allocated"}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Users className="w-3.5 h-3.5" /> Team Lead
            </div>
            <p className="mt-1 font-semibold text-slate-200">{team.leadName || "Not provided"}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Users className="w-3.5 h-3.5" /> Team Members
            </div>
            <p className="mt-1 font-semibold text-slate-200">{team.members.length}</p>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-800 pt-4">
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push(`/judge/evaluation/${team.id}`)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Open Assigned Rubric
          </Button>
        </div>
      </div>
    </div>
  );
}
