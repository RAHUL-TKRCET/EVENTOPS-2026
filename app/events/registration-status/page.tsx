"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { eventsApi } from "@/lib/api/events";
import { authApi } from "@/lib/api/auth";
import { EventItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, LoaderCircle, RefreshCw } from "lucide-react";

type PageState = "loading" | "ready" | "not-found" | "unavailable";
type RegistrationStatus = {
  eventId: string;
  eventName: string;
  registered: boolean;
  registrationId?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

function classify(error: unknown): PageState {
  const status = error && typeof error === "object" && "status" in error
    ? Number((error as { status?: unknown }).status)
    : undefined;
  const message = error instanceof Error ? error.message : "";
  if (status === 404 || /404|not found/i.test(message)) return "not-found";
  return "unavailable";
}

function getToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("eventops_token") || sessionStorage.getItem("eventops_token"));
}

export default function EventRegistrationStatusPage() {
  const router = useRouter();
  const params = useSearchParams();
  const eventId = (params.get("eventId") || "").trim();
  const journeyState = params.get("state") || "begin";
  const [event, setEvent] = useState<EventItem | null>(null);
  const [registration, setRegistration] = useState<RegistrationStatus | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [loadingRegistration, setLoadingRegistration] = useState(false);
  const [registrationError, setRegistrationError] = useState("");

  const refreshRegistration = useCallback(async () => {
    if (!eventId || !getToken()) {
      setRegistration(null);
      return;
    }
    setLoadingRegistration(true);
    try {
      const user = await authApi.getMe();
      if (user.role?.toUpperCase() !== "PARTICIPANT") {
        setRegistration(null);
        setRegistrationError("");
        return;
      }
      const result = await authApi.getEventRegistration(eventId);
      setRegistration(result);
      setRegistrationError("");
    } catch (error) {
      const status = error && typeof error === "object" && "status" in error
        ? Number((error as { status?: unknown }).status)
        : undefined;
      if (status === 401) setRegistration(null);
      else setRegistrationError(error instanceof Error ? error.message : "Registration status could not be loaded.");
    } finally {
      setLoadingRegistration(false);
    }
  }, [eventId]);

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

  useEffect(() => { void refreshRegistration(); }, [refreshRegistration]);

  const backToPortal = () => router.push(eventId
    ? `/events/portal?eventId=${encodeURIComponent(eventId)}`
    : "/events");
  const goToRegistration = () => router.push(`/events/register?eventId=${encodeURIComponent(eventId)}`);



  if (pageState === "loading") {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100"><LoaderCircle className="mr-3 h-5 w-5 animate-spin text-indigo-300" /><p className="text-sm text-slate-300">Checking event details…</p></main>;
  }

  if (pageState !== "ready" || !event) {
    const missing = pageState === "not-found";
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100"><section className="w-full max-w-lg space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"><div className="flex items-center gap-3"><CircleAlert className="h-6 w-6 text-amber-300" /><h1 className="text-xl font-bold text-white">{missing ? "Event not found" : "Event registration unavailable"}</h1></div><p role="alert" className="text-sm leading-6 text-slate-300">{missing ? "This link does not identify a valid event. Ask the organizer for the correct portal link." : "We could not verify this event because the event service is unavailable. Nothing has been registered. Please retry when service is restored."}</p><Button variant="outline" onClick={backToPortal}>Back to events</Button></section></main>;
  }

  const registrationOpen = event.status?.toUpperCase() === "PUBLISHED" &&
    Boolean(event.registrationDeadline) &&
    !Number.isNaN(Date.parse(event.registrationDeadline!)) &&
    Date.parse(event.registrationDeadline!) > Date.now();
  const isRegistered = registration?.registered === true && registration.status?.toUpperCase() === "ACTIVE";
  const accountCreated = journeyState === "account-created" && !isRegistered;
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <p className="text-xs font-mono uppercase tracking-widest text-indigo-300">EVENTOPS 2026 · Participant entry</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{event.name}</h1>
          <p className="mt-1 text-xs text-slate-500">Event ID: {event.id}</p>
        </header>
        <section className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
          {isRegistered ? (
            <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-300" /><div><h2 className="text-lg font-semibold text-white">Registration confirmed</h2><p className="mt-2 text-sm leading-6 text-slate-300">You are registered for {event.name}. Registration ID: <span className="font-mono">{registration?.registrationId}</span>. This does not automatically create a team or project.</p><p className="mt-2 text-xs text-slate-500">Status: {registration?.status}. Confirmed by the event registration API.</p></div></div>
          ) : accountCreated ? (
            <div className="flex items-start gap-3"><CircleAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-300" /><div><h2 className="text-lg font-semibold text-white">Registration is not complete</h2><p className="mt-2 text-sm leading-6 text-slate-300">There is no confirmed enrollment for {event.name}. Use the public registration form to create your participant space and event membership.</p></div></div>
          ) : (
            <div><h2 className="text-lg font-semibold text-white">Register for {event.name}</h2><p className="mt-2 text-sm leading-6 text-slate-300">Submit the public registration form without signing in. The system creates your participant space and emails your login details.</p></div>
          )}
          {event.status?.toUpperCase() !== "PUBLISHED" && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">This event is currently {event.status || "not published"}. New participant registration is available only for published events.</p>}
          {event.status?.toUpperCase() === "PUBLISHED" && !registrationOpen && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">The registration deadline has passed or is not configured. Existing registration status can still be checked, but new enrollments are closed.</p>}
          {registrationError && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{registrationError}</p>}
          {loadingRegistration && <p className="text-xs text-slate-500">Checking persisted registration status…</p>}
          {registrationError && <Button variant="outline" onClick={() => void refreshRegistration()}><RefreshCw className="mr-2 h-4 w-4" />Retry status check</Button>}
          <div className="flex flex-wrap gap-3">
            {isRegistered && <Button variant="primary" onClick={() => router.push(`/participant?eventId=${encodeURIComponent(event.id)}`)}>Open participant workspace <ArrowRight className="ml-2 h-4 w-4" /></Button>}
            
            {!isRegistered && registrationOpen && <Button variant="primary" onClick={goToRegistration}>Register for this event <ArrowRight className="ml-2 h-4 w-4" /></Button>}
            {!isRegistered && getToken() && !registrationOpen && <Button variant="outline" onClick={() => router.push(`/participant/login?eventId=${encodeURIComponent(event.id)}`)}>Open participant login</Button>}
            <Button variant="outline" onClick={backToPortal}><ArrowLeft className="mr-2 h-4 w-4" />Back to event portal</Button>
          </div>
          <p className="text-xs leading-5 text-slate-500">Event registrations are stored separately per event. A registration is confirmed only after the backend returns an active registration record. Team setup is a separate step.</p>
        </section>
      </div>
    </main>
  );
}
