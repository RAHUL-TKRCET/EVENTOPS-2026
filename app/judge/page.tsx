"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAssignedJudgeTeams } from "@/hooks/useAssignedJudgeTeams";
import { useAppStore } from "@/store";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  MapPin,
  QrCode,
  Scale,
} from "lucide-react";

export default function JudgeDashboardPage() {
  const router = useRouter();
  const { currentUser, currentEvent } = useAppStore();
  const { teams, isLoading, error, eventName } = useAssignedJudgeTeams();

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider">
            Judge Workspace
          </span>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            Welcome{currentUser?.name ? `, ${currentUser.name}` : ""}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {eventName || "No event selected"} • Your team list is resolved by the authenticated event session.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
            disabled={isLoading || !!error || teams.length === 0}
            onClick={() => router.push(`/judge/evaluation/${teams[0]?.id}`)}
          >
            Open Next Rubric
          </Button>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-300 flex items-start gap-3">
        <Scale className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          Team assignments are loaded from the event API. The backend validates the active event and judge assignment before returning teams; this dashboard does not substitute sample teams when a request fails.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Assigned Teams"
          value={teams.length}
          subtitle={isLoading ? "Loading from event API…" : "Event-scoped response"}
          icon={<Scale className="w-4 h-4 text-indigo-400" />}
        />
        <KPICard
          title="Current Event"
          value={currentEvent?.name || "Not selected"}
          subtitle="Selected event session"
          accentColor="sky"
          icon={<CalendarDays className="w-4 h-4 text-sky-400" />}
        />
        <KPICard
          title="Current Round"
          value={currentEvent?.currentRound ? `Round ${currentEvent.currentRound}` : "Not available"}
          subtitle="Configured event value"
          accentColor="amber"
          icon={<ClipboardCheck className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {isLoading && (
        <div role="status" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
          Loading your assigned teams…
        </div>
      )}

      {!isLoading && error && (
        <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 space-y-2">
          <h2 className="text-sm font-semibold text-rose-200">Your judge queue is unavailable</h2>
          <p className="text-xs leading-relaxed text-rose-100/80">{error}</p>
        </div>
      )}

      {!isLoading && !error && teams.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center space-y-2">
          <Scale className="w-8 h-8 text-slate-500 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-200">No assigned teams</h2>
          <p className="text-xs text-slate-400">
            The event service has not returned any teams for this judge yet.
          </p>
          <Button size="sm" variant="outline" onClick={() => router.push("/judge/teams")}>
            View Assignment Queue
          </Button>
        </div>
      )}

      {!isLoading && !error && teams.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Assigned Teams
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {teams.length} team{teams.length === 1 ? "" : "s"} returned for this judge and event.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => router.push("/judge/teams")}>
              View All Assignments <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-3">
            {teams.slice(0, 5).map((team) => (
              <article key={team.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">{team.id}</span>
                    <span className="font-semibold text-slate-100 text-sm">{team.name}</span>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400">
                      Assigned
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{team.project.title || "Project details not provided"}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {team.assignedVenueName || team.assignedVenue || "Not allocated"}
                    </span>
                    <span>Bench: <strong className="text-indigo-300">{team.assignedBench || "Not allocated"}</strong></span>
                    <span>Check-in: <StatusBadge status={team.checkInStatus} /></span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => router.push(`/judge/evaluation/${team.id}`)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Open Rubric
                </Button>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
