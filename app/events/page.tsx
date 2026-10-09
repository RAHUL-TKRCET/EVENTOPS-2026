"use client";

import React, { useState } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import { mockEvents } from "@/lib/mock-data/events";
import { EventItem } from "@/types";
import { Calendar, Plus, Users, Building, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EventsListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>(mockEvents);

  const columns: Column<EventItem>[] = [
    {
      key: "name",
      header: "Event Title & Scope",
      sortable: true,
      render: (e) => (
        <div>
          <div className="font-semibold text-slate-100">{e.name}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{e.description}</div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Event Type",
      sortable: true,
      render: (e) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
          {e.type}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: "startDate",
      header: "Dates",
      render: (e) => (
        <div className="text-[11px] font-mono text-slate-300">
          {new Date(e.startDate).toLocaleDateString()} - {new Date(e.endDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "registeredTeamsCount",
      header: "Enrolled",
      sortable: true,
      render: (e) => (
        <span className="font-mono text-xs">
          <span className="font-bold text-indigo-400">{e.registeredTeamsCount}</span> /{" "}
          {e.expectedParticipants}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (e) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/events/${e.id}`)}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Open Hub
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono">Managed Events & Programs</h2>
          <p className="text-xs text-slate-400">
            Lifecycle operations for hackathons, technical symposiums, summits, and career fairs.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => router.push("/events/create")}
        >
          Create New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Events" value={events.length} subtitle="3 active tenants" icon={<Calendar className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Live Operations" value="1 Event" change="VISTRA Hackathon" changeType="positive" accentColor="emerald" icon={<Users className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Scheduled Venues" value="44 Suites" subtitle="Total facilities booked" accentColor="sky" icon={<Building className="w-4 h-4 text-sky-400" />} />
      </div>

      <DataTable
        data={events}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchPlaceholder="Filter events by title or category..."
        searchFilter={(e, q) =>
          e.name.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
        }
        onRowClick={(e) => router.push(`/events/${e.id}`)}
      />
    </div>
  );
}
