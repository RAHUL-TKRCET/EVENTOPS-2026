"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store";
import { venuesApi } from "@/lib/api/venues";
import { incidentsApi } from "@/lib/api/incidents";
import { Venue } from "@/types";
import { Button } from "@/components/ui/Button";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Wifi,
  Zap,
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
  assignedTo?: string | null;
}

export default function TechnicalStaffDashboardPage() {
  const params = useSearchParams();
  const { currentEvent } = useAppStore();
  const eventId = (params.get("eventId") || currentEvent?.id || "").trim();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [incidents, setIncidents] = useState<OpsIncident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!eventId) {
      setVenues([]);
      setIncidents([]);
      setError("No event is selected. Sign in through the event-specific Technical Staff login link.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [venueRows, incidentRows] = await Promise.all([
        venuesApi.getAll(eventId),
        incidentsApi.getAll(eventId),
      ]);
      setVenues(venueRows);
      setIncidents(incidentRows as unknown as OpsIncident[]);
    } catch (requestError) {
      setVenues([]);
      setIncidents([]);
      setError(requestError instanceof Error ? requestError.message : "Technical operations data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  const openIncidents = incidents.filter((incident) => !["RESOLVED", "CLOSED"].includes((incident.status || "").toUpperCase()));
  const maintenanceVenues = venues.filter((venue) => venue.status === "MAINTENANCE");
  const fullVenues = venues.filter((venue) => venue.status === "FULL");

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-orange-500/20 bg-gradient-to-r from-orange-950/30 via-slate-900 to-slate-950 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-orange-300">Technical Staff Workspace</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{currentEvent?.name || "Technical operations"}</h1>
          <p className="mt-2 text-sm text-slate-400">Venue configuration and incident records are loaded from the event API.</p>
          {eventId && <p className="mt-1 font-mono text-xs text-slate-600">Event ID: {eventId}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={loading} onClick={() => void load()}>{loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh</Button>
          <Link href={eventId ? `/incidents/create?eventId=${encodeURIComponent(eventId)}` : "/incidents/create"} className="inline-flex items-center rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-500"><AlertTriangle className="mr-2 h-4 w-4" />Report incident</Link>
        </div>
      </header>

      <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300"><ShieldCheck className="h-5 w-5 shrink-0 text-orange-300" /><p>Work-order and equipment-checklist records are not yet represented by a dedicated backend model. This screen therefore shows only persisted venues and incidents and does not simulate task completion.</p></div>

      {error && <div role="alert" className="flex gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><AlertCircle className="h-5 w-5 shrink-0" /><p>{error}</p></div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center gap-2 text-sm text-slate-400"><Building2 className="h-4 w-4" />Configured venues</div><p className="mt-2 text-2xl font-bold text-white">{loading ? "…" : venues.length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center gap-2 text-sm text-slate-400"><AlertTriangle className="h-4 w-4" />Open incidents</div><p className="mt-2 text-2xl font-bold text-amber-200">{loading ? "…" : openIncidents.length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center gap-2 text-sm text-slate-400"><Zap className="h-4 w-4" />Venues in maintenance</div><p className="mt-2 text-2xl font-bold text-rose-200">{loading ? "…" : maintenanceVenues.length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex items-center gap-2 text-sm text-slate-400"><Wifi className="h-4 w-4" />Full venues</div><p className="mt-2 text-2xl font-bold text-sky-200">{loading ? "…" : fullVenues.length}</p></div>
      </section>

      {loading && <div role="status" className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300"><LoaderCircle className="h-5 w-5 animate-spin" />Loading technical operations…</div>}

      {!loading && !error && <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Event venues</h2><span className="text-xs text-slate-500">{venues.length} record(s)</span></div>
        {venues.length === 0 ? <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">No venues are configured for this event.</div> : venues.map((venue) => <article key={venue.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{venue.name}</h3><span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-300">{venue.status}</span></div><p className="mt-1 text-sm text-slate-400">{venue.building || "Building not specified"}{venue.floor ? ` · Floor ${venue.floor}` : ""} · Capacity {venue.capacity}</p></div>
          <div className="text-sm text-slate-400">{venue.benches?.length ?? 0} bench record(s) · {venue.hasPower ? "Power" : "No power flag"} · {venue.hasInternet ? "Network available" : "No network flag"}</div>
        </article>)}
      </section>}

      {!loading && !error && <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Incident queue</h2><span className="text-xs text-slate-500">{openIncidents.length} open</span></div>
        {incidents.length === 0 ? <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">No incidents have been recorded for this event.</div> : incidents.map((incident) => <article key={incident.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-semibold text-white">{incident.title}</h3><p className="mt-1 text-sm text-slate-400">{incident.description}</p><p className="mt-2 text-xs text-slate-500">{incident.category} · {incident.location}</p></div><div className="flex gap-2"><span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-300">{incident.severity}</span><span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-300">{incident.status}</span></div></div>
        </article>)}
      </section>}
    </main>
  );
}
