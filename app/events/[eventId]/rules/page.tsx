"use client";

import React from "react";
import { useParams } from "next/navigation";
import { mockEvents } from "@/lib/mock-data/events";
import { ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function EventRulesPage() {
  const params = useParams();
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
          <h2 className="text-xl font-bold font-mono text-white">Event Governance & Rules</h2>
          <p className="text-xs text-slate-400">
            Mandatory compliance rules, code of conduct, and hardware constraints.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {(event?.rules || []).map((rule) => (
          <div
            key={rule.id}
            className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 flex items-start gap-3"
          >
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-100">{rule.title}</h4>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                  {rule.category}
                </span>
                {rule.isMandatory && (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Mandatory
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{rule.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
