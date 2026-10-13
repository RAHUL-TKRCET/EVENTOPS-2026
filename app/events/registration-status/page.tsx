"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { eventsApi } from "@/lib/api/events";
import { EventItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";

type PageState = "loading" | "ready" | "not-found" | "unavailable";

function classify(error: unknown): PageState {
  const message = error instanceof Error ? error.message : "";
  const status = error && typeof error === "object" && "status" in error
    ? Number((error as { status?: unknown }).status)
    : undefined;
  if (status === 404 || /404|not found/i.test(message)) return "not-found";
  return "unavailable";
}

export default function EventRegistrationStatusPage() {
  const router = useRouter();
  const params = useSearchParams();
  const eventId = (params.get("eventId") || "").trim();
  const journeyState = params.get("state") || "begin";
  const accountCreated = journeyState === "account-created";
  const [event, setEvent] = useState<EventItem | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");

  useEffect(() => {
    let active = true;
    if (!eventId) {
      setPageState("not-found");
      return () => { active = false; };
    }
    eventsApi.getPublicById(eventId).then((result) => {
      if (!active) return;
      setEvent(result);
      setPageState("ready");
    }).catch((error: unknown) => {
      if (active) setPageState(classify(error));
    });
    return () => { active = false; };
  }, [eventId]);

  const backToPortal = () => router.push(eventId
    ? `/events/portal?eventId=${encodeURIComponent(eventId)}`
    : "/events");
  const signInForEvent = () => router.push(
    `/events/login?eventId=${encodeURIComponent(eventId)}&role=PARTICIPANT`
  );
  const createAccount = () => router.push(
    `/register?accountType=PARTICIPANT&eventId=${encodeURIComponent(eventId)}`
  );

  if (pageState === "loading") {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100"><LoaderCircle className="mr-3 h-5 w-5 animate-spin text-indigo-300" /><p className="text-sm text-slate-300">Checking event details…</p></main>;
  }

  if (pageState !== "ready" || !event) {
    const missing = pageState === "not-found";
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100"><section className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"><div className="flex items-center gap-3"><CircleAlert className="h-6 w-6 text-amber-300" /><h1 className="text-xl font-bold text-white">{missing ? "Event not found" : "Event registration unavailable"}</h1></div><p role="alert" className="text-sm leading-6 text-slate-300">{missing ? "This link does not identify a valid event. Ask the organizer for the correct portal link." : "We could not verify this event because the event service is unavailable. Nothing has been registered. Please retry when service is restored."}</p><Button variant="outline" onClick={backToPortal}>Back to events</Button></section></main>;
  }

  const registrationOpen = event.status?.toUpperCase() === "PUBLISHED";
  const canStartAccount = registrationOpen && !accountCreated;
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <p className="text-xs font-mono uppercase tracking-widest text-indigo-300">EVENTOPS 2026 · Participant entry</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{event.name}</h1>
          <p className="mt-1 text-xs text-slate-500">Event ID: {event.id}</p>
        </header>
        <section className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
          {accountCreated ? (
            <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-300" /><div><h2 className="text-lg font-semibold text-white">Account created — event enrollment is not complete</h2><p className="mt-2 text-sm leading-6 text-slate-300">Your EVENTOPS account was created. This does not register you for {event.name}; no event registration or team membership has been confirmed on this screen.</p></div></div>
          ) : (
            <div><h2 className="text-lg font-semibold text-white">Continue with {event.name}</h2><p className="mt-2 text-sm leading-6 text-slate-300">Event enrollment is a separate step from creating an account. Sign in with an existing participant account, or create one first.</p></div>
          )}
          {event.status?.toUpperCase() !== "PUBLISHED" && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">This event is currently {event.status || "not published"}. Registration availability is not confirmed by the current public event API, so enrollment cannot be started here.</p>}
          {event.status?.toUpperCase() === "PUBLISHED" && <p className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300">The event is published. The current backend does not yet expose a persisted participant-enrollment operation from this page, so this step will not claim to register you automatically.</p>}
          <div className="flex flex-wrap gap-3">
            {registrationOpen && <Button variant="primary" onClick={signInForEvent}>Sign in as participant <ArrowRight className="ml-2 h-4 w-4" /></Button>}
            {canStartAccount && <Button variant="outline" onClick={createAccount}>Create participant account</Button>}
            <Button variant="outline" onClick={backToPortal}><ArrowLeft className="mr-2 h-4 w-4" />Back to event portal</Button>
          </div>
          <p className="text-xs leading-5 text-slate-500">Event IDs identify the requested context, not access rights. Participant access is granted only after backend verification of the event enrollment.</p>
        </section>
      </div>
    </main>
  );
}
