"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { eventsApi } from "@/lib/api/events";
import { EventItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Calendar, CircleAlert, LoaderCircle, RefreshCw, ArrowRight } from "lucide-react";

type RegistrationSummary = { eventId: string; eventName: string; status: string; createdAt?: string | null };
type LoadState = "loading" | "ready" | "unauthenticated" | "forbidden" | "unavailable" | "not-found";

function classify(error: unknown): LoadState {
  const status = error && typeof error === "object" && "status" in error ? Number((error as {status?: unknown}).status) : undefined;
  const message = error instanceof Error ? error.message : "";
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404 || /not found/i.test(message)) return "not-found";
  return "unavailable";
}

function hasToken() {
  return typeof window !== "undefined" && Boolean(localStorage.getItem("eventops_token") || sessionStorage.getItem("eventops_token"));
}

export default function ParticipantDashboardPage() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedEventId = (params.get("eventId") || "").trim();
  const [state, setState] = useState<LoadState>("loading");
  const [event, setEvent] = useState<EventItem | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationSummary[]>([]);
  const [registration, setRegistration] = useState<Awaited<ReturnType<typeof authApi.getEventRegistration>> | null>(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    setState("loading");
    setMessage("");
    setEvent(null);
    setRegistration(null);
    if (!hasToken()) {
      setState("unauthenticated");
      return;
    }
    try {
      if (requestedEventId) {
        const [eventDetails, ownRegistration] = await Promise.all([
          eventsApi.getPublicById(requestedEventId),
          authApi.getEventRegistration(requestedEventId),
        ]);
        setEvent(eventDetails);
        setRegistration(ownRegistration);
        setState("ready");
      } else {
        const ownEvents = await authApi.getEventRegistrations();
        setRegistrations(ownEvents);
        setState("ready");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Participant data could not be loaded.");
      setState(classify(error));
    }
  };

  useEffect(() => { void load(); }, [requestedEventId]);

  const signIn = () => router.push(requestedEventId
    ? `/events/login?eventId=${encodeURIComponent(requestedEventId)}&role=PARTICIPANT`
    : "/login");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <p className="text-xs font-mono uppercase tracking-widest text-pink-300">EVENTOPS 2026 · Participant workspace</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{event ? event.name : "My event registrations"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">This workspace displays only event memberships confirmed by the backend for your account. Team, project, QR, attendance and allocation details appear only when those event-scoped APIs are available.</p>
        </header>

        {state === "loading" && <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-300"><LoaderCircle className="h-5 w-5 animate-spin text-indigo-300" />Loading your registered event data…</div>}

        {state !== "loading" && state !== "ready" && (
          <section className="space-y-3 rounded-2xl border border-amber-500/30 bg-slate-900 p-5">
            <div className="flex items-center gap-2"><CircleAlert className="h-5 w-5 text-amber-300" /><h2 className="font-semibold text-white">{state === "unauthenticated" ? "Sign in required" : state === "forbidden" ? "Event access denied" : state === "not-found" ? "Event not found" : "Participant data unavailable"}</h2></div>
            <p role="alert" className="text-sm leading-6 text-slate-300">{state === "unauthenticated" ? "Sign in with your participant account to see your own event registrations." : state === "forbidden" ? "Your current session is not authorized for this event. Open the event login link for the event you are registered in." : state === "not-found" ? "This event link does not identify a valid event." : message || "The service could not verify your event membership. No sample data is being shown."}</p>
            <div className="flex flex-wrap gap-3">
              {state === "unauthenticated" && <Button variant="primary" onClick={signIn}>Sign in <ArrowRight className="ml-2 h-4 w-4" /></Button>}
              <Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
              <Button variant="outline" onClick={() => router.push("/events")}>Browse events</Button>
            </div>
          </section>
        )}

        {state === "ready" && requestedEventId && event && registration && (
          registration.registered && registration.status?.toUpperCase() === "ACTIVE" ? (
            <section className="space-y-4 rounded-2xl border border-emerald-500/30 bg-slate-900 p-6">
              <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-emerald-300" /><h2 className="text-lg font-semibold text-white">Registration active</h2></div>
              <p className="text-sm text-slate-300">You are registered for <strong>{event.name}</strong>.</p>
              <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Registration ID</dt><dd className="mt-1 font-mono text-slate-200">{registration.registrationId}</dd></div><div><dt className="text-xs text-slate-500">Status</dt><dd className="mt-1 text-emerald-200">{registration.status}</dd></div></dl>
              <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm leading-6 text-slate-400">No team or project is attached to this registration yet. Team creation and participant data views are separate workflows and will not be fabricated here.</p>
              <Button variant="outline" onClick={() => router.push(`/events/registration-status?eventId=${encodeURIComponent(event.id)}&state=registered`)}>View registration confirmation</Button>
            </section>
          ) : (
            <section className="space-y-3 rounded-2xl border border-amber-500/30 bg-slate-900 p-6">
              <h2 className="font-semibold text-white">No active registration for this event</h2>
              <p className="text-sm text-slate-300">Your account is valid, but the backend has not confirmed an active enrollment for this event.</p>
              <Button variant="primary" onClick={() => router.push(`/events/register?eventId=${encodeURIComponent(event.id)}`)}>Register for this event</Button>
            </section>
          )
        )}

        {state === "ready" && !requestedEventId && (
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-white">My registered events</h2>
            {registrations.length === 0 ? (
              <div className="space-y-3 rounded-xl border border-dashed border-slate-700 p-5"><p className="text-sm text-slate-400">No active event registration was found for this account.</p><Button variant="outline" onClick={() => router.push("/events")}>Browse events</Button></div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">{registrations.map((item) => <article key={item.eventId} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-xs font-mono text-indigo-300">{item.eventId}</p><h3 className="mt-2 font-semibold text-white">{item.eventName}</h3><p className="mt-1 text-xs text-slate-400">Registration status: {item.status}</p><Button className="mt-4" size="sm" variant="outline" onClick={() => router.push(`/participant?eventId=${encodeURIComponent(item.eventId)}`)}>Open event <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button></article>)}</div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
