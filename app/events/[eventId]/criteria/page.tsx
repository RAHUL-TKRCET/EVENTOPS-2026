"use client";

import React from "react";
import { useParams } from "next/navigation";
import { mockEvents } from "@/lib/mock-data/events";
import { Trophy, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function EventCriteriaPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const event = mockEvents.find((e) => e.id === eventId) || mockEvents[0];
  const round1 = event?.rounds?.[0];

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
          <h2 className="text-xl font-bold font-mono text-white">Evaluation Criteria & Rubrics</h2>
          <p className="text-xs text-slate-400">
            Weighted assessment parameters enforced across digital jury terminals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(round1?.criteria || []).map((c) => (
          <div key={c.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-indigo-400 font-bold">{c.id}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Weight: {c.weight * 100}%
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-100">{c.name}</h4>
            <p className="text-xs text-slate-400">{c.description}</p>
            <div className="text-xs font-mono text-slate-300 pt-2 border-t border-slate-800">
              Max Score: <span className="font-bold text-white">{c.maxScore} pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
