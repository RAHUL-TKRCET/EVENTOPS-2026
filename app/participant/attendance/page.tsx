"use client";

import React from "react";
import { mockTeams } from "@/lib/mock-data/teams";
import { StatusBadge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import { CheckCircle2, ShieldCheck, Clock, Users, MapPin } from "lucide-react";

export default function ParticipantAttendancePage() {
  const team = mockTeams.find((t) => t.id === "T042") || mockTeams[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-pink-400 uppercase">Attendance Verification</span>
          <StatusBadge status="CHECKED_IN" />
        </div>
        <h1 className="text-xl font-bold font-mono text-white mt-1">Team Attendance Record</h1>
        <p className="text-xs text-slate-400">
          Official check-in audit timestamp recorded at Atrium Terminal
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Team Check-in"
          value="Verified"
          accentColor="emerald"
          subtitle="Timestamp: 08:45 AM"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <KPICard
          title="Members Present"
          value={`${team.members.length} / ${team.members.length}`}
          subtitle="100% Quorum"
          icon={<Users className="w-4 h-4 text-indigo-400" />}
        />
        <KPICard
          title="Assigned Workstation"
          value={team.assignedBench || "B042"}
          subtitle={team.assignedVenueName || "Turing Hall Suite"}
          accentColor="sky"
          icon={<MapPin className="w-4 h-4 text-sky-400" />}
        />
      </div>

      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          Individual Member Check-In Status
        </h3>
        <div className="divide-y divide-slate-800">
          {team.members.map((m) => (
            <div key={m.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100 text-xs">{m.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{m.role}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">{m.email}</div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="font-mono text-slate-400 text-[11px]">
                  Scanned: <span className="text-slate-200">08:45 AM</span>
                </span>
                <StatusBadge status={m.checkInStatus} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
