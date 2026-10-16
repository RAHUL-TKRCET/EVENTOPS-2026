"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store";
import { teamsApi } from "@/lib/api/teams";
import { venuesApi } from "@/lib/api/venues";
import { incidentsApi } from "@/lib/api/incidents";
import { resourcesApi, ApiResourceItem } from "@/lib/api/resources";
import { Team, Venue } from "@/types";
import { Button } from "@/components/ui/Button";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  ClipboardList,
  LoaderCircle,
  Package,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

interface OpsIncident {
  id: string;
  eventId: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  location: string;
  reportedAt?: string;
}

export default function RealTimeControlCenterPage() {
  const params = useSearchParams();
  const { currentEvent } = useAppStore();
  const eventId = (params.get("eventId") || currentEvent?.id || "").trim();
  const [teams, setTeams] = useState<Team[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [incidents, setIncidents] = useState<OpsIncident[]>([]);
  const [resources, setResources] = useState<ApiResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!eventId) {
      setTeams([]);
      setVenues([]);
      setIncidents([]);
      setResources([]);
      setError("No event is selected. Open the control center from an event-scoped Coordinator login.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [teamRows, venueRows, incidentRows, resourceRows] = await Promise.all([
        teamsApi.getAll(eventId),
        venuesApi.getAll(eventId),
        incidentsApi.getAll(eventId),
        resourcesApi.getAll(eventId),
      ]);
      setTeams(teamRows);
      setVenues(venueRows);
      setIncidents(incidentRows as unknown as OpsIncident[]);
      setResources(resourceRows);
    } catch (requestError) {
      setTeams([]);
      setVenues([]);
      setIncidents([]);
      setResources([]);
      setError(requestError instanceof Error ? requestError.message : "Event operations data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  const checkedIn = teams.filter((team) => team.checkInStatus === "CHECKED_IN").length;
  const openIncidents = incidents.filter((incident) => !["RESOLVED", "CLOSED"].includes((incident.status || "").toUpperCase()));
  const remainingStock = resources.reduce((sum, item) => sum + Math.max(0, item.totalQuantity - item.distributedQuantity), 0);
  const venuesMaintenance = venues.filter((venue) => venue.status === "MAINTENANCE").length;

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/35 via-slate-900 to-slate-950 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">Coordinator Control Center</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{currentEvent?.name || "Event operations"}</h1>
          <p className="mt-2 text-sm text-slate-400">Live counts are fetched from the selected event's authorized APIs; no fixture data is mixed in.</p>
          {eventId && <p className="mt-1 font-mono text-xs text-slate-600">Event ID: {eventId}</p>}
        </div>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>{loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh data</Button>
      </header>

      <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300"><ShieldCheck className="h-5 w-5 shrink-0 text-cyan-300" /><p>Every API request is scoped by the authenticated event session. This board intentionally shows only persisted team, venue, incident and inventory records.</p></div>

      {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><AlertCircle className="h-5 w-5 shrink-0" /><p>{error}</p></div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center gap-2 text-sm text-slate-400"><Users className="h-4 w-4" />Registered teams</div><p className="mt-2 text-2xl font-bold text-white">{loading ? "…" : teams.length}</p><p className="mt-1 text-xs text-slate-500">{loading ? "Loading…" : `${checkedIn} checked in`}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center gap-2 text-sm text-slate-400"><Building2 className="h-4 w-4" />Configured venues</div><p className="mt-2 text-2xl font-bold text-white">{loading ? "…" : venues.length}</p><p className="mt-1 text-xs text-slate-500">{loading ? "Loading…" : `${venuesMaintenance} in maintenance`}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center gap-2 text-sm text-slate-400"><AlertTriangle className="h-4 w-4" />Open incidents</div><p className="mt-2 text-2xl font-bold text-amber-200">{loading ? "…" : openIncidents.length}</p><p className="mt-1 text-xs text-slate-500">{loading ? "Loading…" : `${incidents.length} incident record(s) total`}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center gap-2 text-sm text-slate-400"><Package className="h-4 w-4" />Remaining inventory</div><p className="mt-2 text-2xl font-bold text-emerald-200">{loading ? "…" : remainingStock}</p><p className="mt-1 text-xs text-slate-500">{loading ? "Loading…" : `${resources.length} inventory record(s)`}</p></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-indigo-300" /><h2 className="font-semibold text-white">Coordinator actions</h2></div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800" href={eventId ? `/volunteers/tasks?eventId=${encodeURIComponent(eventId)}` : "/volunteers/tasks"}>Manage volunteer tasks</Link>
            <Link className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800" href={eventId ? `/attendance/scanner?eventId=${encodeURIComponent(eventId)}` : "/attendance/scanner"}>Open check-in scanner</Link>
            <Link className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800" href={eventId ? `/resource-manager?eventId=${encodeURIComponent(eventId)}` : "/resource-manager"}>Inventory overview</Link>
            <Link className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800" href={eventId ? `/incidents/create?eventId=${encodeURIComponent(eventId)}` : "/incidents/create"}>Report incident</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold text-white">Incident watch</h2>
          {!loading && openIncidents.length === 0 ? <p className="mt-3 text-sm text-slate-400">No open incidents for this event.</p> : <div className="mt-3 space-y-3">{openIncidents.slice(0, 5).map((incident) => <article key={incident.id} className="border-b border-slate-800 pb-3 last:border-0"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-medium text-white">{incident.title}</h3><span className="shrink-0 rounded-full border border-amber-500/30 px-2 py-1 text-[10px] text-amber-200">{incident.severity}</span></div><p className="mt-1 text-xs text-slate-400">{incident.location} · {incident.status}</p></article>)}</div>}
          {!loading && !error && teams.length === 0 && venues.length === 0 && incidents.length === 0 && resources.length === 0 && <p className="mt-3 text-xs text-slate-500">The API returned no operational records yet. This is a live empty state, not a fallback to demo examples.</p>}
        </div>
      </section>
    </main>
  );
}
