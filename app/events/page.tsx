"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import { EventItem } from "@/types";
import { Calendar, Plus, Users, Building, ArrowRight, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { eventsApi } from "@/lib/api/events";

export default function EventsListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = async () => {
    setIsLoading(true);
    setError("");
    try {
      setEvents(await eventsApi.getAll());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load events for this workspace.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadEvents(); }, []);

  const columns: Column<EventItem>[] = [
    {
      key: "name",
      header: "Event Title & Scope",
      sortable: true,
      render: (event) => (
        <div>
          <div className="font-semibold text-slate-100">{event.name}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{event.description}</div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Event Type",
      sortable: true,
      render: (event) => <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">{event.type}</span>,
    },
    { key: "status", header: "Status", sortable: true, render: (event) => <StatusBadge status={event.status} /> },
    {
      key: "startDate",
      header: "Dates",
      render: (event) => <div className="text-[11px] font-mono text-slate-300">{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</div>,
    },
    {
      key: "registeredTeamsCount",
      header: "Enrolled",
      sortable: true,
      render: (event) => <span className="font-mono text-xs"><span className="font-bold text-indigo-400">{event.registeredTeamsCount}</span> / {event.expectedParticipants}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (event) => <Button size="sm" variant="outline" onClick={() => router.push(`/events/${event.id}`)} rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>Open hub</Button>,
    },
  ];

  const activeCount = useMemo(() => events.filter((event) => ["LIVE", "ACTIVE", "IN_PROGRESS"].includes(String(event.status).toUpperCase())).length, [events]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-mono text-xl font-bold text-white">Managed events & programs</h2>
          <p className="text-sm text-slate-400">Events retrieved from your authorized organization workspace.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="md" onClick={() => void loadEvents()} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
          <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => router.push("/events/create")}>Create event</Button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title="Total events" value={events.length} icon={<Calendar className="h-4 w-4 text-indigo-400" />} />
        <KPICard title="Active events" value={activeCount} accentColor="emerald" icon={<Users className="h-4 w-4 text-emerald-400" />} />
        <KPICard title="Organization scope" value="Restricted" subtitle="Access checked by the backend" accentColor="sky" icon={<Building className="h-4 w-4 text-sky-400" />} />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-800 p-8 text-center text-sm text-slate-400">Loading organization events…</div>
      ) : events.length === 0 && !error ? (
        <div className="rounded-2xl border border-slate-800 p-8 text-center">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          <h3 className="font-semibold text-white">No events yet</h3>
          <p className="mt-1 text-sm text-slate-400">Create your first event to begin organizing your program.</p>
          <Button className="mt-4" variant="primary" onClick={() => router.push("/events/create")}>Create first event</Button>
        </div>
      ) : !isLoading ? (
        <DataTable
          data={events}
          columns={columns}
          keyExtractor={(event) => event.id}
          searchPlaceholder="Filter by title or category…"
          searchFilter={(event, query) =>
            event.name.toLowerCase().includes(query) ||
            event.type.toLowerCase().includes(query) ||
            (event.description || "").toLowerCase().includes(query)
          }
          onRowClick={(event) => router.push(`/events/${event.id}`)}
        />
      ) : null}
    </div>
  );
}
