"use client";

import React from "react";
import { mockEvents } from "@/lib/mock-data/events";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KPICard } from "@/components/ui/KPICard";
import { Trophy, ArrowRight, Plus, Layers, Users, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RoundsOverviewPage() {
  const router = useRouter();
  const event = mockEvents[0]; // VISTRA Hackathon 2026

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Round Lifecycle & Tournament Progression</h2>
          <p className="text-xs text-slate-400">
            Automated quota advancement, live rubric leaderboards, and stage transitions.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push("/rounds/rnd-01/ranking")}
            leftIcon={<Trophy className="w-4 h-4 text-amber-400" />}
          >
            Live Leaderboard
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => router.push("/rounds/create")}
          >
            Create Round
          </Button>
        </div>
      </div>

      {/* Visual Tournament Stage Pipeline */}
      <div className="p-6 rounded-2xl border border-indigo-500/20 bg-slate-900/80 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
          Tournament Progression Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(event?.rounds || []).length === 0 ? (
            <div className="col-span-3 p-6 text-center text-xs text-slate-500 font-mono">
              No tournament rounds configured yet. Click "Create Round" to initialize stages.
            </div>
          ) : (
            (event?.rounds || []).map((round, idx) => {
            const isCurrent = round.order === 1;

            return (
              <div
                key={round.id}
                onClick={() => router.push(`/rounds/${round.id}/ranking`)}
                className={`p-5 rounded-xl border text-xs space-y-3 transition cursor-pointer relative overflow-hidden ${
                  isCurrent
                    ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-400">STAGE 0{round.order}</span>
                  <StatusBadge status={round.status} />
                </div>

                <h4 className="text-sm font-bold text-slate-100">{round.name}</h4>

                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-slate-400 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>Advancement Cap:</span>
                    <span className="text-emerald-400 font-bold">{round.qualifyingQuota} Teams</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Criteria Rubrics:</span>
                    <span className="text-slate-200">{round.criteria.length} Rubrics</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <span className="text-indigo-400 text-xs font-semibold flex items-center gap-1">
                    Leaderboard & Advancement →
                  </span>
                </div>
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
}
