"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockEvents } from "@/lib/mock-data/events";
import { KPICard } from "@/components/ui/KPICard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import {
  Calendar,
  Users,
  Building,
  Scale,
  Settings,
  Layers,
  Clock,
  ShieldCheck,
  Trophy,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const event = mockEvents.find((e) => e.id === eventId) || mockEvents[0];

  const submodules = [
    { title: "Rounds & Timeline", desc: "Progression quotas & schedule", href: `/events/${event.id}/rounds`, icon: <Layers className="w-5 h-5 text-indigo-400" /> },
    { title: "Time Slots", desc: "Capacity windows & pitch intervals", href: `/events/${event.id}/timeslots`, icon: <Clock className="w-5 h-5 text-sky-400" /> },
    { title: "Evaluation Criteria", desc: "Dynamic rubrics & scoring weights", href: `/events/${event.id}/criteria`, icon: <Trophy className="w-5 h-5 text-amber-400" /> },
    { title: "Event Rules & Safety", desc: "Eligibility & code of conduct", href: `/events/${event.id}/rules`, icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
    { title: "Event Settings", desc: "Metadata, banner & access flags", href: `/events/${event.id}/settings`, icon: <Settings className="w-5 h-5 text-slate-400" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Event Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-indigo-400 font-bold uppercase">{event.id}</span>
              <StatusBadge status={event.status} />
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {event.type}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-mono text-white mt-1">{event.name}</h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">{event.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/allocation/optimization")}
            >
              Run Allocation
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/control-center")}
            >
              Enter Control Center
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 text-[11px]">Starts</span>
            <p className="font-mono font-medium text-slate-200">{new Date(event.startDate).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Ends</span>
            <p className="font-mono font-medium text-slate-200">{new Date(event.endDate).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Registration Deadline</span>
            <p className="font-mono font-medium text-slate-200">{new Date(event.registrationDeadline).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Current Stage</span>
            <p className="font-mono font-bold text-indigo-400">Round {event.currentRound} of {event.totalRounds}</p>
          </div>
        </div>
      </div>

      {/* Submodule Jump Cards */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Event Configuration & Rules Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {submodules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800/80 hover:border-slate-700 transition flex items-start justify-between group cursor-pointer"
            >
              <div className="space-y-1">
                <div className="p-2.5 rounded-xl bg-slate-800 w-fit border border-slate-700/60 mb-2">
                  {mod.icon}
                </div>
                <h4 className="text-sm font-semibold text-slate-100 group-hover:text-white">
                  {mod.title}
                </h4>
                <p className="text-xs text-slate-400">{mod.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
