"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { mockEvents } from "@/lib/mock-data/events";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Layers, Plus, ArrowLeft, Clock, Users } from "lucide-react";
import Link from "next/link";

export default function EventRoundsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const event = mockEvents.find((e) => e.id === eventId) || mockEvents[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={event ? `/events/${event.id}` : "/events"}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Event Rounds & Progression Rules</h2>
          <p className="text-xs text-slate-400">
            Define round lifecycle, start times, qualifying quotas, and advancement criteria.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {(event?.rounds || []).map((round, idx) => (
          <div
            key={round.id}
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 font-mono text-xs font-bold text-indigo-400 flex items-center justify-center">
                  R{round.order}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">{round.name}</h3>
                  <p className="text-xs text-slate-400">
                    {new Date(round.startTime).toLocaleTimeString()} - {new Date(round.endTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={round.status} />
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Advancement Cap: {round.qualifyingQuota} Teams
                </span>
              </div>
            </div>

            {/* Criteria mini list */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                Assigned Evaluation Criteria ({round.criteria.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                {round.criteria.map((crit) => (
                  <div key={crit.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between font-medium text-slate-200">
                      <span>{crit.name}</span>
                      <span className="font-mono text-indigo-400">Max {crit.maxScore}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{crit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
