"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Server,
  Zap,
  Wifi,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";

export default function TechnicalStaffDashboardPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState([
    { id: "T-01", title: "Deploy 5GHz Wi-Fi Access Point in Suite B204", room: "B204", status: "PENDING", priority: "HIGH" },
    { id: "T-02", title: "Check 230V AC Surge Breakers in Turing Hall", room: "Turing Hall", status: "COMPLETED", priority: "URGENT" },
    { id: "T-03", title: "Replace HDMI Extender Cable on Main Projector", room: "Hall Alpha", status: "IN_PROGRESS", priority: "MEDIUM" },
    { id: "T-04", title: "Verify Backup UPS Battery Level in Server Room", room: "SR-01", status: "COMPLETED", priority: "HIGH" },
  ]);

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "COMPLETED" ? "PENDING" : "COMPLETED" }
          : t
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl border border-orange-500/20 bg-gradient-to-r from-orange-950/30 via-slate-900 to-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-orange-400 uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
              Technical Infrastructure Terminal
            </span>
            <StatusBadge status="ACTIVE" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            Technical Operations Command
          </h1>
          <p className="text-xs text-slate-400">
            Network latency monitoring, power grid distribution, equipment checkout, and room readiness
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<QrCode className="w-4 h-4 text-indigo-400" />}
            onClick={() => router.push("/attendance/scanner")}
          >
            Scan Equipment Barcode
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<AlertTriangle className="w-4 h-4" />}
            onClick={() => router.push("/incidents/create")}
          >
            Log Technical Incident
          </Button>
        </div>
      </div>

      {/* Role Scoping Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
          <span>
            Technical Staff Clearance: Authorized for room equipment, Wi-Fi nodes, power distribution, and hardware incident resolutions.
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">NETOPS SECURE</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard
          title="Assigned Rooms"
          value="24 Suites"
          subtitle="All Rooms Online"
          accentColor="emerald"
          icon={<Building className="w-4 h-4 text-emerald-400" />}
        />
        <KPICard
          title="Grid Power Status"
          value="230V Nominal"
          accentColor="sky"
          subtitle="Zero Circuit Trips"
          icon={<Zap className="w-4 h-4 text-sky-400" />}
        />
        <KPICard
          title="Floor Wi-Fi Health"
          value="1.2 Gbps"
          accentColor="indigo"
          subtitle="9ms Ping • 350 Clients"
          icon={<Wifi className="w-4 h-4 text-indigo-400" />}
        />
        <KPICard
          title="Open Tech Tickets"
          value="1 Active"
          accentColor="amber"
          subtitle="Avg resolution 12m"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Main Grid: Room Readiness & Equipment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Rooms List */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Assigned Lab Suites & Readiness
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/technical-staff/rooms")}
            >
              All Rooms →
            </Button>
          </div>

          <div className="space-y-3">
            {[
              { id: "R001", name: "Hall A — Turing Hall", status: "ACTIVE", benches: "30 Benches", power: "100%", net: "980 Mbps" },
              { id: "R002", name: "Hall B — Lovelace Lab", status: "ACTIVE", benches: "25 Benches", power: "100%", net: "1.1 Gbps" },
              { id: "R003", name: "Suite C — Hopper Center", status: "ACTIVE", benches: "20 Benches", power: "100%", net: "940 Mbps" },
              { id: "R004", name: "Auditorium Main Stage", status: "STANDBY", benches: "A/V Rig", power: "100%", net: "1.2 Gbps" },
            ].map((room) => (
              <div
                key={room.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-400 font-bold">{room.id}</span>
                    <span className="font-semibold text-white">{room.name}</span>
                    <StatusBadge status={room.status as any} />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {room.benches} • Power: <span className="text-emerald-400 font-semibold">{room.power}</span> • Speed: <span className="text-sky-400 font-semibold">{room.net}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push("/technical-staff/rooms")}
                >
                  Manage
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Tasks Queue */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Technical Tasks Queue
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {tasks.filter((t) => t.status === "COMPLETED").length} of {tasks.length} Resolved
            </span>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => {
              const isDone = task.status === "COMPLETED";

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 text-xs ${
                    isDone
                      ? "border-emerald-500/20 bg-emerald-500/5 opacity-80"
                      : "border-slate-800 bg-slate-950"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-orange-400">{task.id}</span>
                      <span className={`font-semibold ${isDone ? "line-through text-slate-400" : "text-slate-100"}`}>
                        {task.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Location: <span className="text-slate-300">{task.room}</span> • Priority: <span className="text-amber-400">{task.priority}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 font-mono text-[11px] ${
                      isDone
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isDone ? "Done" : "Mark Done"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
