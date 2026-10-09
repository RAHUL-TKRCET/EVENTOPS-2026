"use client";

import React from "react";
import { mockTeams } from "@/lib/mock-data/teams";
import { mockJudges } from "@/lib/mock-data/judges";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import {
  MapPin,
  Cpu,
  Zap,
  Wifi,
  Scale,
  Clock,
  ShieldCheck,
  Lock,
  Layers,
} from "lucide-react";

export default function ParticipantAllocationPage() {
  const team = mockTeams.find((t) => t.id === "T042") || mockTeams[0];
  const assignedJudgeObjs = mockJudges.filter((j) => team.assignedJudges?.includes(j.id));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-pink-400 uppercase">
            Workstation & Resource Allocation
          </span>
          <StatusBadge status="ACTIVE" />
        </div>
        <h1 className="text-xl font-bold font-mono text-white mt-1">
          My Assigned Workstation & Venue
        </h1>
        <p className="text-xs text-slate-400">
          Generated via automated OR-Tools CP-SAT constraint satisfaction optimization
        </p>
      </div>

      {/* Read-only guard notice */}
      <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-3">
        <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>
          Allocation is locked by the Operations Director. Participants cannot modify table assignments.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Assigned Room"
          value={team.assignedVenueName || `Suite ${team.assignedVenue}`}
          subtitle="Building B, Floor 2"
          icon={<MapPin className="w-4 h-4 text-indigo-400" />}
        />
        <KPICard
          title="Workstation Bench"
          value={team.assignedBench || "B042"}
          subtitle="Quad Seating Pod"
          accentColor="emerald"
          icon={<Layers className="w-4 h-4 text-emerald-400" />}
        />
        <KPICard
          title="Evaluation Window"
          value="11:30 AM"
          subtitle="Round 1 In-Person Pitch"
          accentColor="sky"
          icon={<Clock className="w-4 h-4 text-sky-400" />}
        />
      </div>

      {/* Facilities & Infrastructure at the bench */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          Bench Infrastructure & Technical Specifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Zap className="w-4 h-4" />
              <span>AC Power Outlets</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              4x 230V surge-protected sockets with dedicated 16A breaker for hardware rigs.
            </p>
            <div className="font-mono text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded w-max">
              STATUS: OPERATIONAL
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-semibold">
              <Wifi className="w-4 h-4" />
              <span>High-Speed Internet</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              SSID: <span className="font-mono text-white">VISTRA-HACK-5G</span>
              <br />
              WPA3 Key: <span className="font-mono text-white">innovate2026</span>
            </p>
            <div className="font-mono text-[10px] text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded w-max">
              1.0 Gbps FIBER
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Scale className="w-4 h-4" />
              <span>Jury Panel Assignment</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              2 Domain Evaluators scheduled to visit bench at 11:30 AM for rubric assessment.
            </p>
            <div className="font-mono text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded w-max">
              PANEL ASSIGNED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
