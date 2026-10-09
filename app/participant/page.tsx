"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockTeams } from "@/lib/mock-data/teams";
import { mockEvents } from "@/lib/mock-data/events";
import {
  Users,
  QrCode,
  MapPin,
  Calendar,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from "lucide-react";

export default function ParticipantDashboardPage() {
  const router = useRouter();
  // Participant scoped team is T042 (BioSense)
  const myTeam = mockTeams.find((t) => t.id === "T042") || mockTeams[0];
  const currentEvent = mockEvents[0];

  return (
    <div className="space-y-6">
      {/* Participant Header */}
      <div className="p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-pink-400 uppercase tracking-wider bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
              Participant Terminal • {myTeam?.id || "N/A"}
            </span>
            <StatusBadge status="CHECKED_IN" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            Welcome back, {myTeam?.leadName || "Participant"}
          </h1>
          <p className="text-xs text-slate-400">
            {myTeam?.name || "My Team"} • {currentEvent?.name || "EventOps"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            leftIcon={<QrCode className="w-4 h-4" />}
            onClick={() => router.push("/participant/qr")}
          >
            Display My QR Pass
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Team Registration"
          value={myTeam.id}
          subtitle={`${myTeam.members.length} Confirmed Members`}
          icon={<Users className="w-4 h-4 text-indigo-400" />}
        />
        <KPICard
          title="Assigned Venue"
          value={myTeam.assignedVenueName || `Suite ${myTeam.assignedVenue}`}
          subtitle={`Workstation ${myTeam.assignedBench}`}
          accentColor="sky"
          icon={<MapPin className="w-4 h-4 text-sky-400" />}
        />
        <KPICard
          title="Check-In Status"
          value="Checked In"
          subtitle="Badge Verified"
          accentColor="emerald"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <KPICard
          title="Current Stage"
          value={`Round ${myTeam.currentRound}`}
          subtitle="Pitch Slot 11:30 AM"
          accentColor="amber"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Project Card */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                Active Project
              </span>
              <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {myTeam.project.domain}
              </span>
            </div>
            <h3 className="text-base font-bold text-white leading-snug">
              {myTeam.project.title}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-3">
              {myTeam.project.abstract}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-4"
            onClick={() => router.push("/participant/project")}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View Project Details
          </Button>
        </div>

        {/* Workstation & Allocation Card */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                Workstation Allocation
              </span>
              <span className="text-[11px] font-mono text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                CP-SAT Optimized
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              {myTeam.assignedVenueName || `Hall Turing • Room ${myTeam.assignedVenue}`}
            </h3>
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Desk / Bench:</span>
                <span className="font-mono font-bold text-indigo-300">{myTeam.assignedBench}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dedicated Power:</span>
                <span className="text-emerald-400 font-semibold">230V Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">High-Speed Wi-Fi:</span>
                <span className="font-mono text-slate-200">VISTRA-HACK-5G</span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-4"
            onClick={() => router.push("/participant/allocation")}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Full Allocation Specs
          </Button>
        </div>

        {/* Digital EventPass QR Card (Display Only) */}
        <div className="p-6 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Digital EventPass</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Check-In & Meal Token
            </h3>
            <p className="text-xs text-slate-300">
              Present this credential at security checkpoints, meal counters, and jury verification.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-indigo-500/30 font-mono text-[11px] text-indigo-300 text-center truncate">
              {myTeam.qrCodeToken}
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            className="w-full mt-4"
            onClick={() => router.push("/participant/qr")}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Open Full QR Pass
          </Button>
        </div>
      </div>

      {/* Schedule and Teammates section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roster */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              My Teammates ({myTeam.members.length})
            </h3>
            <Link
              href="/participant/team"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition"
            >
              Manage Roster →
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {myTeam.members.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-100">{m.name}</span>
                    {m.role === "LEADER" && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Lead
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{m.email}</div>
                </div>
                <StatusBadge status={m.checkInStatus} />
              </div>
            ))}
          </div>
        </div>

        {/* Live Announcements preview */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Participant Bulletins
            </h3>
            <Link
              href="/participant/announcements"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition"
            >
              All Bulletins →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                <span>Lunch Counters Open at 12:30 PM</span>
                <span className="font-mono text-[10px] text-slate-400">11:00 AM</span>
              </div>
              <p className="text-xs text-slate-300">
                Present your Digital EventPass at Dining Hall B. Veg, Non-Veg, and Jain counters are clearly marked.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span>Round 1 Jury Evaluation Schedule Published</span>
                <span className="font-mono text-[10px] text-slate-400">10:15 AM</span>
              </div>
              <p className="text-xs text-slate-400">
                Please ensure all hardware and local prototypes are powered on at your assigned bench.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
