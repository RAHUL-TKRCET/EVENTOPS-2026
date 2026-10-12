"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAssignedJudgeTeams } from "@/hooks/useAssignedJudgeTeams";
import { useAppStore } from "@/store";
import { ArrowRight, CalendarDays, ClipboardCheck, Scale } from "lucide-react";

export default function JudgeAssignedTeamsPage() {
  const router = useRouter();
  const { currentUser, currentEvent } = useAppStore();
  const { teams, isLoading, error, eventName } = useAssignedJudgeTeams();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-amber-400 font-bold uppercase">
            Judge / Evaluator Workspace
          </span>
          <h1 className="text-xl font-bold font-mono text-white mt-1">My Assigned Teams</h1>
          <p className="text-xs text-slate-400 mt-1">
            {currentUser?.name ? `Signed in as ${currentUser.name}` : "Authenticated judge session"} 
            {eventName ? ` • ${eventName}` : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/judge/history")}>
          Evaluation History
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Assigned Teams"
          value={teams.length}
          subtitle={isLoading ? "Loading from the event API…" : "Returned by the event-scoped API"}
          icon={<Scale className="w-4 h-4 text-indigo-400" />}
        />
        <KPICard
          title="Current Event"
          value={currentEvent?.name || "Not selected"}
          subtitle="Event login context"
          accentColor="sky"
          icon={<CalendarDays className="w-4 h-4 text-sky-400" />}
        />
        <KPICard
          title="Current Round"
          value={currentEvent?.currentRound ? `Round ${currentEvent.currentRound}` : "Not available"}
          subtitle="From selected event"
          accentColor="amber"
          icon={<ClipboardCheck className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {isLoading && (
        <div role="status" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
          Loading your assigned teams from the event service…
        </div>
      )}

      {!isLoading && error && (
        <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 space-y-2">
          <h2 className="text-sm font-semibold text-rose-200">Assignments could not be loaded</h2>
          <p className="text-xs leading-relaxed text-rose-100/80">{error}</p>
          <p className="text-xs text-slate-400">
            No mock teams are shown as a fallback. Use the event-specific login link and retry.
          </p>
        </div>
      )}

      {!isLoading && !error && teams.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center space-y-2">
          <Scale className="w-8 h-8 text-slate-500 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-200">No teams assigned yet</h2>
          <p className="text-xs text-slate-400">
            The event service returned no teams for this judge. New assignments will appear here when they are saved.
          </p>
        </div>
      )}

      {!isLoading && !error && teams.length > 0 && (
        <div className="space-y-3">
          {teams.map((team) => (
            <article
              key={team.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">{team.id}</span>
                  <h2 className="font-semibold text-slate-100">{team.name}</h2>
                  <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] text-slate-400">
                    Assigned
                  </span>
                </div>
                <p className="text-xs text-slate-400">{team.project.title || "Project details not provided"}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span>Check-in: <StatusBadge status={team.checkInStatus} /></span>
                  <span>Room: <strong className="text-slate-300">{team.assignedVenueName || team.assignedVenue || "Not allocated"}</strong></span>
                  <span>Bench: <strong className="text-indigo-300">{team.assignedBench || "Not allocated"}</strong></span>
                  <span>Track: {team.project.domain || "Not specified"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/judge/teams/${team.id}`)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Team Brief
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => router.push(`/judge/evaluation/${team.id}`)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Open Rubric
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
