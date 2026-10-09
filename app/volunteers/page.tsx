"use client";

import React, { useState } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KPICard } from "@/components/ui/KPICard";
import { mockVolunteers } from "@/lib/mock-data/volunteers";
import { useAppStore } from "@/store";
import { Volunteer } from "@/types";
import {
  HeartHandshake,
  Plus,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  QrCode,
  AlertTriangle,
  Megaphone,
  MapPin,
  Check,
  Play,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function VolunteersPage() {
  const router = useRouter();
  const { currentRole } = useAppStore();
  const [volunteers] = useState<Volunteer[]>(mockVolunteers);

  // For Volunteer persona:
  const [volunteerTasks, setVolunteerTasks] = useState([
    {
      id: "TSK-01",
      title: "Deliver 40 Vegetarian Lunch Kits to Turing Hall Benches 01-10",
      zone: "Zone A (Turing Hall)",
      priority: "HIGH",
      status: "ASSIGNED" as "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED",
      time: "12:15 PM",
    },
    {
      id: "TSK-02",
      title: "Direct Jury Members to Presentation Room B204",
      zone: "Zone B (Evaluation Suites)",
      priority: "MEDIUM",
      status: "IN_PROGRESS" as "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED",
      time: "11:30 AM",
    },
    {
      id: "TSK-03",
      title: "Conduct QR Badge Scans at Entrance Turnstiles",
      zone: "Main Atrium",
      priority: "URGENT",
      status: "COMPLETED" as "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED",
      time: "08:30 AM",
    },
  ]);

  const advanceTaskStatus = (taskId: string) => {
    setVolunteerTasks(
      volunteerTasks.map((t) => {
        if (t.id !== taskId) return t;
        let nextStatus: "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" = "COMPLETED";
        if (t.status === "ASSIGNED") nextStatus = "ACCEPTED";
        else if (t.status === "ACCEPTED") nextStatus = "IN_PROGRESS";
        else if (t.status === "IN_PROGRESS") nextStatus = "COMPLETED";
        return { ...t, status: nextStatus };
      })
    );
  };

  // If viewing as field volunteer, render dedicated volunteer portal view
  if (currentRole === "VOLUNTEER") {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-3xl border border-teal-500/20 bg-gradient-to-r from-teal-950/30 via-slate-900 to-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-teal-400 uppercase tracking-wider bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                Volunteer Field Terminal
              </span>
              <StatusBadge status="ON_DUTY" />
            </div>
            <h1 className="text-2xl font-bold font-mono text-white mt-1">
              Field Operations Dashboard
            </h1>
            <p className="text-xs text-slate-400">
              Shift: Morning Shift (08:00 AM - 02:00 PM) • Station: Zone A (Turing Hall)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              leftIcon={<QrCode className="w-4 h-4 text-teal-400" />}
              onClick={() => router.push("/attendance/scanner")}
            >
              QR Check-In Scanner
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<AlertTriangle className="w-4 h-4" />}
              onClick={() => router.push("/incidents/create")}
            >
              Report Incident
            </Button>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              Volunteer Field Clearance: Authorized for task state progression, floor check-ins, and incident escalation.
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">FIELD MARSHAL</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <KPICard title="My Assigned Tasks" value="3 Total" subtitle="1 Pending Action" icon={<HeartHandshake className="w-4 h-4 text-teal-400" />} />
          <KPICard title="Shift Progress" value="3.5 Hours" accentColor="emerald" subtitle="2.5 Hours Remaining" icon={<Clock className="w-4 h-4 text-emerald-400" />} />
          <KPICard title="Current Zone" value="Zone A" accentColor="sky" subtitle="Turing Hall Suites" icon={<MapPin className="w-4 h-4 text-sky-400" />} />
          <KPICard title="Tasks Completed" value="1 Done" accentColor="indigo" subtitle="Verified on Board" icon={<CheckCircle className="w-4 h-4 text-indigo-400" />} />
        </div>

        {/* Task Lifecycle Section: Assigned -> Accepted -> In Progress -> Completed */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                My Task Board & Lifecycle Progression
              </h3>
              <p className="text-xs text-slate-400">
                Lifecycle: <span className="font-mono text-indigo-400">ASSIGNED → ACCEPTED → IN PROGRESS → COMPLETED</span>
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/volunteers/tasks")}
            >
              Full Task Board →
            </Button>
          </div>

          <div className="space-y-3">
            {volunteerTasks.map((t) => {
              const isCompleted = t.status === "COMPLETED";

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
                    isCompleted
                      ? "border-emerald-500/20 bg-emerald-500/5 opacity-80"
                      : "border-slate-800 bg-slate-950/80"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-400">{t.id}</span>
                      <span className={`font-semibold text-sm ${isCompleted ? "line-through text-slate-400" : "text-white"}`}>
                        {t.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
                      <span>Station: <strong className="text-slate-200">{t.zone}</strong></span>
                      <span>Target: {t.time}</span>
                      <span className="text-amber-400 font-bold">{t.priority}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                        t.status === "ASSIGNED"
                          ? "bg-slate-800 text-slate-300 border-slate-700"
                          : t.status === "ACCEPTED"
                          ? "bg-sky-500/10 text-sky-300 border-sky-500/30"
                          : t.status === "IN_PROGRESS"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {t.status}
                    </span>

                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => advanceTaskStatus(t.id)}
                        rightIcon={<Play className="w-3.5 h-3.5" />}
                      >
                        {t.status === "ASSIGNED"
                          ? "Accept Task"
                          : t.status === "ACCEPTED"
                          ? "Start Task"
                          : "Mark Done"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Admin / Coordinator view
  const columns: Column<Volunteer>[] = [
    {
      key: "name",
      header: "Staff / Volunteer",
      sortable: true,
      render: (v) => (
        <div>
          <div className="font-semibold text-slate-100">{v.name}</div>
          <div className="text-[11px] text-slate-500 font-mono">{v.email}</div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Operations Role",
      sortable: true,
      render: (v) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
          {v.role}
        </span>
      ),
    },
    {
      key: "zone",
      header: "Assigned Zone",
      render: (v) => <span className="text-xs text-slate-300">{v.zone}</span>,
    },
    {
      key: "status",
      header: "Duty Status",
      sortable: true,
      render: (v) => <StatusBadge status={v.status} />,
    },
    {
      key: "tasks",
      header: "Tasks Completed",
      render: (v) => (
        <span className="font-mono text-xs">
          <span className="font-bold text-emerald-400">{v.completedTasksCount}</span> / {v.assignedTasksCount}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Profile",
      render: (v) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/volunteers/${v.id}`)}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Volunteer & Field Staff Operations</h2>
          <p className="text-xs text-slate-400">
            Shift scheduling, zone marshaling, and rapid task delegation.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push("/volunteers/tasks")}
          >
            Live Task Board
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => router.push("/volunteers/create")}
          >
            Enroll Volunteer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Roster" value="35 Volunteers" subtitle="Active Staff" icon={<HeartHandshake className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Currently On Duty" value="28 Active" accentColor="emerald" subtitle="Covering 24 Suites" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Active Shifts" value="Morning Shift" subtitle="08:00 AM - 02:00 PM" accentColor="sky" icon={<Clock className="w-4 h-4 text-sky-400" />} />
      </div>

      <DataTable
        data={volunteers}
        columns={columns}
        keyExtractor={(v) => v.id}
        searchPlaceholder="Search volunteers by name, zone, or role..."
        searchFilter={(v, q) =>
          v.name.toLowerCase().includes(q) ||
          v.role.toLowerCase().includes(q) ||
          v.zone.toLowerCase().includes(q)
        }
      />
    </div>
  );
}
