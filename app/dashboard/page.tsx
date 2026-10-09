"use client";

import React, { useState } from "react";
import { KPICard, ChartCard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Feedback";
import { useAppStore } from "@/store";
import { mockTeams } from "@/lib/mock-data/teams";
import { mockVenues } from "@/lib/mock-data/venues";
import { mockJudges } from "@/lib/mock-data/judges";
import { mockIncidents } from "@/lib/mock-data/incidents";
import { mockVolunteerTasks } from "@/lib/mock-data/volunteers";
import { mockResources } from "@/lib/mock-data/resources";
import { useRouter } from "next/navigation";
import {
  Users,
  CheckCircle2,
  XCircle,
  Scale,
  Building,
  HeartHandshake,
  Box,
  AlertTriangle,
  Trophy,
  ArrowRight,
  Sparkles,
  Cpu,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";



export default function DashboardPage() {
  const router = useRouter();
  const { currentEvent } = useAppStore();

  const checkedInCount = mockTeams.filter((t) => t.checkInStatus === "CHECKED_IN").length;
  const absentCount = mockTeams.filter((t) => t.checkInStatus === "ABSENT").length;
  const occupiedVenuesCount = mockVenues.filter((v) => v.status === "ACTIVE").length;
  const availableVenuesCount = mockVenues.filter((v) => v.status === "STANDBY").length;
  const activeJudgesCount = mockJudges.filter((j) => j.workloadStatus !== "UNAVAILABLE").length;
  const openIncidentsCount = mockIncidents.filter((i) => i.status !== "RESOLVED").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              OPERATIONAL HUB
            </span>
            <span className="text-xs text-slate-400 font-mono">36-Hour Continuous Operations</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-mono text-white mt-1">
            {currentEvent?.name || "VISTRA Hackathon 2026"}
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Round 1 Code & Architecture Screening in progress. 120 teams deployed across 24 suites.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/attendance/scanner")}
            leftIcon={<Users className="w-3.5 h-3.5 text-indigo-400" />}
          >
            Inspect Participant QR
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/allocation/optimization")}
            leftIcon={<Cpu className="w-3.5 h-3.5" />}
          >
            OR-Tools Optimizer
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/control-center")}
            leftIcon={<ExternalLink className="w-3.5 h-3.5 text-emerald-400" />}
          >
            Live ECC
          </Button>
        </div>
      </div>

      {/* Top 12 Operational KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <KPICard
          title="Registered"
          value="120"
          subtitle="Teams Enrolled"
          accentColor="indigo"
          icon={<Users className="w-4 h-4 text-indigo-400" />}
          onClick={() => router.push("/teams")}
        />
        <KPICard
          title="Checked-In"
          value={checkedInCount}
          change="95%"
          changeType="positive"
          accentColor="emerald"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          onClick={() => router.push("/attendance/teams")}
        />
        <KPICard
          title="Absent"
          value={absentCount}
          change="6 Flags"
          changeType="negative"
          accentColor="rose"
          icon={<XCircle className="w-4 h-4 text-rose-400" />}
          onClick={() => router.push("/attendance/teams")}
        />
        <KPICard
          title="Active Judges"
          value={`${activeJudgesCount}/20`}
          subtitle="2 Overloaded"
          accentColor="amber"
          icon={<Scale className="w-4 h-4 text-amber-400" />}
          onClick={() => router.push("/judges")}
        />
        <KPICard
          title="Pending Evals"
          value="4"
          subtitle="Rubric Submissions"
          accentColor="sky"
          icon={<Clock className="w-4 h-4 text-sky-400" />}
          onClick={() => router.push("/judge/teams")}
        />
        <KPICard
          title="Occupied Rooms"
          value={`${occupiedVenuesCount}/24`}
          subtitle="120 Benches"
          accentColor="violet"
          icon={<Building className="w-4 h-4 text-violet-400" />}
          onClick={() => router.push("/venues")}
        />
        <KPICard
          title="Available Rooms"
          value={availableVenuesCount}
          subtitle="Standby Suites"
          accentColor="emerald"
          icon={<Building className="w-4 h-4 text-emerald-400" />}
          onClick={() => router.push("/venues")}
        />
        <KPICard
          title="Active Staff"
          value="28/35"
          subtitle="Volunteers on Duty"
          accentColor="indigo"
          icon={<HeartHandshake className="w-4 h-4 text-indigo-400" />}
          onClick={() => router.push("/volunteers/tasks")}
        />
        <KPICard
          title="Pending Tasks"
          value={mockVolunteerTasks.filter((t) => t.status !== "COMPLETED").length}
          subtitle="Escorts & Supplies"
          accentColor="amber"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          onClick={() => router.push("/volunteers/tasks")}
        />
        <KPICard
          title="Open Incidents"
          value={openIncidentsCount}
          change="1 Critical"
          changeType="negative"
          accentColor="rose"
          icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
          onClick={() => router.push("/incidents")}
        />
        <KPICard
          title="Meals Remaining"
          value="238"
          subtitle="Dinner Batch A"
          accentColor="emerald"
          icon={<Box className="w-4 h-4 text-emerald-400" />}
          onClick={() => router.push("/resources/food")}
        />
        <KPICard
          title="Current Round"
          value="Round 1"
          subtitle="48 to Advance"
          accentColor="violet"
          icon={<Trophy className="w-4 h-4 text-violet-400" />}
          onClick={() => router.push("/rounds")}
        />
      </div>

      {/* Main Section Grid: Charts & Operations Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Attendance Velocity & Judge Balance */}
        <div className="lg:col-span-2 space-y-6">


          {/* Critical Operations Matrix Snapshot */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Live Operations Feed</h3>
                <p className="text-xs text-slate-400">Sub-second operational state transitions</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ● Live Updates Active
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-200 font-medium">Team T042 (BioSense Glucose) checked in at Gate B</span>
                </div>
                <span className="font-mono text-slate-500 text-[11px]">2 mins ago</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-slate-200 font-medium">Judge J007 (Dr. Elena Rostova) workload reached 92%</span>
                </div>
                <span className="font-mono text-slate-500 text-[11px]">8 mins ago</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-slate-200 font-medium">Incident INC-2041: AP 3B Packet Drop flagged in Room 205</span>
                </div>
                <span className="font-mono text-slate-500 text-[11px]">14 mins ago</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="text-slate-200 font-medium">Volunteer Task tsk-01: Scanner T3 calibration completed</span>
                </div>
                <span className="font-mono text-slate-500 text-[11px]">22 mins ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Control Widgets */}
        <div className="space-y-6">
          {/* Quick Intelligent Optimizer Status */}
          <div className="p-5 rounded-2xl border border-indigo-500/30 bg-slate-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-indigo-400 font-bold uppercase">CP-SAT Allocator</span>
              <StatusBadge status="OPTIMAL" />
            </div>
            <h4 className="text-sm font-semibold text-slate-100">Jury & Venue Allocation</h4>
            <p className="text-xs text-slate-400">
              120 teams matched to 24 suites and 20 evaluators with zero hard constraint violations.
            </p>
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Domain Match Quality</span>
                <span className="text-indigo-400 font-bold">98.4%</span>
              </div>
              <ProgressBar value={98.4} color="indigo" />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2"
              onClick={() => router.push("/allocation/results")}
            >
              View Allocation Matrix →
            </Button>
          </div>

          {/* Quick Incidents Snapshot */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-rose-400 font-bold uppercase">Open Incidents</span>
              <span className="text-xs font-mono text-slate-400">1 Critical</span>
            </div>
            <div className="space-y-2">
              {mockIncidents.slice(0, 2).map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => router.push("/incidents")}
                  className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition cursor-pointer text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{inc.title}</span>
                    <StatusBadge status={inc.priority} />
                  </div>
                  <p className="text-[11px] text-slate-400">{inc.location} • {inc.reportedBy}</p>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/incidents")}
            >
              Incident Command Board →
            </Button>
          </div>

          {/* Quick Resource Reserves */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-emerald-400 font-bold uppercase">Logistics Depot</span>
              <span className="text-xs text-slate-400">Inventory Status</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-mono">
                  <span>Day 1 Dinner Boxes</span>
                  <span>412 / 650</span>
                </div>
                <ProgressBar value={(412 / 650) * 100} color="emerald" />
              </div>
              <div>
                <div className="flex justify-between text-slate-300 font-mono">
                  <span>Cold Brew & Energy Drinks</span>
                  <span className="text-amber-400 font-bold">980 / 1200 (Low)</span>
                </div>
                <ProgressBar value={(980 / 1200) * 100} color="amber" />
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/resources/food")}
            >
              Manage Logistics Depot →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
