"use client";

import React, { useState } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KPICard } from "@/components/ui/KPICard";
import { mockIncidents } from "@/lib/mock-data/incidents";
import { Incident } from "@/types";
import { AlertTriangle, Plus, CheckCircle, ShieldAlert, ArrowRight, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IncidentsListPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  const openCount = incidents.filter((i) => i.status !== "RESOLVED").length;
  const criticalCount = incidents.filter((i) => i.priority === "CRITICAL" && i.status !== "RESOLVED").length;

  const filtered = priorityFilter === "ALL"
    ? incidents
    : incidents.filter((i) => i.priority === priorityFilter);

  const resolveIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "RESOLVED", resolvedAt: new Date().toISOString() } : i))
    );
  };

  const columns: Column<Incident>[] = [
    {
      key: "id",
      header: "Incident ID",
      sortable: true,
      className: "w-24 font-mono font-bold text-rose-400",
    },
    {
      key: "title",
      header: "Incident Scope",
      sortable: true,
      render: (i) => (
        <div>
          <div className="font-semibold text-slate-100">{i.title}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{i.description}</div>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Severity",
      sortable: true,
      render: (i) => <StatusBadge status={i.priority} />,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (i) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
          {i.category}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (i) => <span className="text-xs text-slate-300">{i.location}</span>,
    },
    {
      key: "status",
      header: "Lifecycle",
      sortable: true,
      render: (i) => <StatusBadge status={i.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (i) => (
        <div className="flex items-center gap-2">
          {i.status !== "RESOLVED" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                resolveIncident(i.id);
              }}
              className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
            >
              Resolve ✓
            </button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/incidents/${i.id}`)}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Incident & Operations Helpdesk</h2>
          <p className="text-xs text-slate-400">
            Rapid escalation, facility resolution, and hardware support dispatch.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => router.push("/incidents/create")}
        >
          Report Incident
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Open Incidents" value={openCount} subtitle="Requires Resolution" accentColor="rose" icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} />
        <KPICard title="Critical Priority" value={criticalCount} subtitle="Immediate SLA Escalation" accentColor="amber" icon={<ShieldAlert className="w-4 h-4 text-amber-400" />} />
        <KPICard title="Resolved Today" value="3 Incidents" subtitle="Median Time to Resolve: 18 mins" accentColor="emerald" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${
              priorityFilter === p
                ? "bg-indigo-600 text-white font-bold"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(i) => i.id}
        searchPlaceholder="Search incidents..."
        onRowClick={(i) => router.push(`/incidents/${i.id}`)}
      />
    </div>
  );
}
