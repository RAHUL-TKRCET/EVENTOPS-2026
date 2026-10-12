"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { eventsApi } from "@/lib/api/events";
import { EventItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Calendar, MapPin, Users, ArrowRight, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

type PublicFailure = { kind: "not-found" | "unavailable" | "unknown"; message: string };

function explain(error: unknown): PublicFailure {
  const message = error instanceof Error ? error.message : "Unable to load event details.";
  const status = error && typeof error === "object" && "status" in error ? Number((error as {status?: unknown}).status) : undefined;
  if (status === 404 || /404|not found/i.test(message)) return { kind: "not-found", message: "This event does not exist or is no longer available." };
  if (/could not reach the API|network|failed to fetch|endpoint:/i.test(message)) return { kind: "unavailable", message: "The event service is unavailable. Check connectivity and try again." };
  return { kind: "unknown", message };
}

export default function StaticEventPortalPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = (searchParams.get("eventId") || "").trim();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<PublicFailure | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setFailure(null);
      if (!eventId) {
        setFailure({kind:"not-found",message:"This event link is missing eventId. Request an updated event link from the organizer."});
        setLoading(false);
        return;
      }
      try {
        const found = await eventsApi.getPublicById(eventId);
        if (active) setEvent(found);
      } catch (error) {
        if (active) setFailure(explain(error));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [eventId]);

  if (loading) return <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6"><p className="text-sm text-slate-400">Loading event details…</p></main>;
  if (!event || failure) return <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6"><div className="max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-3"><h1 className="text-xl font-bold text-white">{failure?.kind === "not-found" ? "Event not found" : "Event details unavailable"}</h1><p role="alert" className="text-sm text-slate-300">{failure?.message || "Unable to load this event."}</p><Button variant="outline" onClick={() => router.push("/events")}>Back to Events</Button></div></main>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5"><div><p className="text-xs uppercase tracking-widest text-indigo-300">EVENTOPS 2026 · Public Event</p><h1 className="mt-1 text-xl font-bold text-white">{event.name}</h1></div><Button variant="outline" size="sm" onClick={() => router.push(`/events/login?eventId=${encodeURIComponent(event.id)}`)}>Role login <ArrowRight className="ml-2 h-4 w-4" /></Button></div></header>
      <section className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 md:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2"><StatusBadge status={event.status || "DRAFT"} /><span className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300">{event.type}</span><span className="font-mono text-xs text-slate-500">{event.id}</span></div>
          <p className="leading-7 text-slate-300">{event.description || "No additional public description is available."}</p>
          <div className="grid gap-4 border-t border-slate-800 pt-4 sm:grid-cols-2">
            <div className="flex gap-3"><Calendar className="h-5 w-5 text-indigo-300" /><div><p className="text-xs text-slate-500">Start</p><p className="text-sm text-slate-200">{event.startDate ? new Date(event.startDate).toLocaleString() : "Not configured"}</p></div></div>
            <div className="flex gap-3"><Calendar className="h-5 w-5 text-indigo-300" /><div><p className="text-xs text-slate-500">End</p><p className="text-sm text-slate-200">{event.endDate ? new Date(event.endDate).toLocaleString() : "Not configured"}</p></div></div>
            <div className="flex gap-3"><MapPin className="h-5 w-5 text-indigo-300" /><div><p className="text-xs text-slate-500">Location</p><p className="text-sm text-slate-200">{event.location || "Not configured"}</p></div></div>
            <div className="flex gap-3"><Users className="h-5 w-5 text-indigo-300" /><div><p className="text-xs text-slate-500">Expected participants</p><p className="text-sm text-slate-200">{event.expectedParticipants ?? "Not specified"}</p></div></div>
          </div>
          {event.status === "DRAFT" && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">This event is still a draft. The organizer may share a public link, but publication and registration may not be enabled yet.</p>}
          <p className="text-xs text-slate-500">Participant account creation is separate from event enrollment. Registration eligibility is checked by the event registration workflow.</p>
          <div className="flex flex-wrap gap-3 pt-2"><Button variant="primary" onClick={() => router.push(`/events/login?eventId=${encodeURIComponent(event.id)}`)}>Continue to role login</Button><Button variant="outline" onClick={() => router.push(`/register?accountType=PARTICIPANT&eventId=${encodeURIComponent(event.id)}`)}>Register as a participant</Button><Button variant="outline" onClick={() => router.push("/login")}>Organization Admin login</Button></div>
        </div>
      </section>
    </main>
  );
}
