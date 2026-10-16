"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Users, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { EventItem } from "@/types";
import { eventsApi } from "@/lib/api/events";

type PublicEvent = EventItem;

export default function PublicEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      // Public endpoint requires no organization context or authenticated scope.
      const result = await eventsApi.getPublicList();
      setEvents(result.filter((event) => event.status?.toUpperCase() === "PUBLISHED"));
    } catch {
      setEvents([]);
      setError("Public events could not be loaded right now. Try again or open the event link provided by the organizer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-indigo-300">EVENTOPS 2026 · Public events</p>
            <h1 className="mt-2 text-2xl font-bold text-white">Find your event</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Choose a published event to view details and register as a participant. No account is needed to start registration.</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Home
          </Button>
        </header>

        {error && (
          <section role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            <p>{error}</p>
            <Button className="mt-3" size="sm" variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button>
          </section>
        )}

        {loading ? (
          <p className="rounded-2xl border border-slate-800 p-8 text-center text-sm text-slate-400">Loading public events…</p>
        ) : !error && events.length === 0 ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
            <Calendar className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            <h2 className="font-semibold text-white">No published events available</h2>
            <p className="mt-2 text-sm text-slate-400">You can still register using a specific public event link from the organizer.</p>
          </section>
        ) : !error ? (
          <section className="grid gap-4 sm:grid-cols-2">
            {events.map((event) => (
              <article key={event.id} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{event.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{event.type}</p>
                  </div>
                  <StatusBadge status={event.status || "PUBLISHED"} />
                </div>
                <p className="line-clamp-3 text-sm leading-6 text-slate-300">{event.description || "No public description provided."}</p>
                <div className="space-y-2 text-xs text-slate-400">
                  <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo-300" />{event.startDate ? new Date(event.startDate).toLocaleDateString() : "Date to be announced"}</p>
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-indigo-300" />{event.location || "Location to be announced"}</p>
                  <p className="flex items-center gap-2"><Users className="h-4 w-4 text-indigo-300" />Expected participants: {event.expectedParticipants ?? "Not specified"}</p>
                </div>
                <Button variant="primary" block onClick={() => router.push(`/events/portal?eventId=${encodeURIComponent(event.id)}`)}>
                  View event and register <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
