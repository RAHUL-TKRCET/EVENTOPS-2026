"use client";

import React, { useState, useEffect } from "react";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IncidentCard } from "@/components/ui/Cards";
import { mockTeams } from "@/lib/mock-data/teams";
import { mockVenues } from "@/lib/mock-data/venues";
import { mockJudges } from "@/lib/mock-data/judges";
import { mockIncidents } from "@/lib/mock-data/incidents";
import { mockVolunteerTasks } from "@/lib/mock-data/volunteers";
import { mockResources } from "@/lib/mock-data/resources";
import { eventOpsSocket } from "@/lib/websocket";
import {
  Radio,
  Users,
  CheckCircle2,
  XCircle,
  Scale,
  Building,
  HeartHandshake,
  Box,
  AlertTriangle,
  Trophy,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function RealTimeControlCenterPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState(mockIncidents);
  const [lastHeartbeat, setLastHeartbeat] = useState<string>(new Date().toLocaleTimeString());
  const [liveEventLogs, setLiveEventLogs] = useState<string[]>([
    "Jury J007 Rubric recorded for Team T042 (Score: 98/100)",
    "Turnstile B verified Team T018 (Sentrix Cloud)",
    "Facilities team dispatched to Room 102 circuit breaker",
    "Snack depot replenishment completed at Station 2",
  ]);

  // Subscribe to simulated WebSocket events
  useEffect(() => {
    const unsub = eventOpsSocket.subscribe("attendance.updated", (data) => {
      setLastHeartbeat(new Date().toLocaleTimeString());
      setLiveEventLogs((prev) => [
        `Live Check-In Verified: Gate Terminal T${Math.floor(Math.random() * 4) + 1}`,
        ...prev.slice(0, 5),
      ]);
    });
    return () => unsub();
  }, []);

  const handleResolveIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: "RESOLVED" } : inc))
    );
  };

  const checkedInCount = mockTeams.filter((t) => t.checkInStatus === "CHECKED_IN").length;
  const absentCount = mockTeams.filter((t) => t.checkInStatus === "ABSENT").length;
  const openIncidents = incidents.filter((i) => i.status !== "RESOLVED");

  return (
    <div className="space-y-6">
      {/* Header Command Deck */}
      <div className="p-6 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              LIVE EVENT OPERATIONS (ECC)
            </span>
            <span className="text-xs text-slate-400 font-mono">Telemetry Clock: {lastHeartbeat}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-mono text-white tracking-tight mt-1">
            Real-Time Operations Command
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Synchronized event operations spanning turnstile check-ins, jury scoring, spatial suite telemetry, and rapid incident escalation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/allocation/results")}
          >
            Allocation Matrix
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => router.push("/judge/teams")}
          >
            Digital Jury Terminals
          </Button>
        </div>
      </div>

      {/* Top 12 Operational KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <KPICard title="Registered" value="120" subtitle="Total Teams" accentColor="indigo" icon={<Users className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Checked-In" value={checkedInCount} change="95%" changeType="positive" accentColor="emerald" icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Absent" value={absentCount} change="6 Flags" changeType="negative" accentColor="rose" icon={<XCircle className="w-4 h-4 text-rose-400" />} />
        <KPICard title="Active Judges" value="18/20" subtitle="2 Overloaded" accentColor="amber" icon={<Scale className="w-4 h-4 text-amber-400" />} />
        <KPICard title="Pending Evals" value="4" subtitle="Rubric queue" accentColor="sky" />
        <KPICard title="Occupied Rooms" value="22/24" subtitle="Suites Active" accentColor="violet" icon={<Building className="w-4 h-4 text-violet-400" />} />
        <KPICard title="Available Rooms" value="2" subtitle="Standby Cache" accentColor="emerald" />
        <KPICard title="Active Staff" value="28/35" subtitle="Field Marshals" accentColor="indigo" icon={<HeartHandshake className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Pending Tasks" value="5" subtitle="Supplies & Escorts" accentColor="amber" />
        <KPICard title="Open Incidents" value={openIncidents.length} change="1 Critical" changeType="negative" accentColor="rose" icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} />
        <KPICard title="Food Remaining" value="238" subtitle="Dinner Boxes" accentColor="emerald" icon={<Box className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Current Round" value="Round 1" subtitle="Qualifying Cap: 48" accentColor="violet" icon={<Trophy className="w-4 h-4 text-violet-400" />} />
      </div>

      {/* Main Command Matrix Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Telemetry Feeds, Room Status & Judge Radar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spatial Room Occupancy Mini-Radar */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Live Room & Bench Telemetry (24 Suites)</h3>
                <p className="text-xs text-slate-400">Green = Normal • Amber = Heavy Load • Red = Maintenance / Trip</p>
              </div>
              <button
                onClick={() => router.push("/venues")}
                className="text-xs text-indigo-400 hover:underline font-mono"
              >
                Expand Floorplan →
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {mockVenues.map((venue, idx) => {
                const isTripped = idx === 1; // Room 102
                const isStandby = venue.status === "STANDBY";
                return (
                  <div
                    key={venue.id}
                    onClick={() => router.push(`/venues/${venue.id}`)}
                    className={`p-2 rounded-xl border text-center transition cursor-pointer select-none ${
                      isTripped
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse"
                        : isStandby
                        ? "bg-slate-950/60 border-slate-800 text-slate-500"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:border-emerald-500"
                    }`}
                  >
                    <span className="font-mono text-xs font-bold block">{venue.id}</span>
                    <span className="text-[10px] font-mono block opacity-80 truncate">
                      {isTripped ? "ALERT" : isStandby ? "STANDBY" : "OK"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Operations Event Bus (WebSocket Output) */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-indigo-400 font-bold uppercase">
                Sub-Second Event Stream
              </span>
              <span className="text-[10px] font-mono text-slate-400">WebSocket / Real-Time Channel</span>
            </div>
            <div className="space-y-1.5 font-mono text-xs text-slate-300">
              {liveEventLogs.map((log, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{log}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">just now</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Urgent Incidents & Immediate Actions */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-rose-500/30 bg-slate-900/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-rose-400 font-bold uppercase">
                Active Incident Triage ({openIncidents.length})
              </span>
              <button
                onClick={() => router.push("/incidents/create")}
                className="text-xs text-rose-400 hover:underline"
              >
                + Report Incident
              </button>
            </div>

            <div className="space-y-3">
              {openIncidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  onStatusChange={handleResolveIncident}
                  onClick={() => router.push(`/incidents/${inc.id}`)}
                />
              ))}
            </div>
          </div>

          {/* Volunteer Floor Marshal Tasks snapshot */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-emerald-400 font-bold uppercase">
                Field Marshal Tasks
              </span>
              <button
                onClick={() => router.push("/volunteers/tasks")}
                className="text-xs text-indigo-400 hover:underline"
              >
                Roster →
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {mockVolunteerTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">{task.title}</div>
                    <div className="text-[10px] text-slate-400">{task.assignedVolunteerName} • {task.zone}</div>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
