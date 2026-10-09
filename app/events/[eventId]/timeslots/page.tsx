"use client";

import React from "react";
import { useParams } from "next/navigation";
import { mockEvents } from "@/lib/mock-data/events";
import { Button } from "@/components/ui/Button";
import { Clock, Plus, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";

export default function EventTimeSlotsPage() {
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
          <h2 className="text-xl font-bold font-mono text-white">Operational Time Slots</h2>
          <p className="text-xs text-slate-400">
            Evaluation windows for scheduling presentations and OR-Tools optimizer batching.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(event?.timeSlots || []).map((slot) => (
          <div
            key={slot.id}
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-indigo-400 font-bold">{slot.id}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Capacity: {slot.capacity} Teams
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-100">{slot.label}</h3>
            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
              <span>Start: {slot.startTime}</span>
              <span>End: {slot.endTime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
