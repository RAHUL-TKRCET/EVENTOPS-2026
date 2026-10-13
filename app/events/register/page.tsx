"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { eventsApi } from "@/lib/api/events";
import { useAppStore } from "@/store";
import { EventItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, ArrowRight, CircleAlert, LoaderCircle } from "lucide-react";

type Failure = { kind: "not-found" | "unavailable"; message: string };
function classify(error: unknown): Failure {
  const status = error && typeof error === "object" && "status" in error ? Number((error as {status?: unknown}).status) : undefined;
  const message = error instanceof Error ? error.message : "Unable to load the event.";
  if (status === 404 || /404|not found/i.test(message)) return { kind: "not-found", message: "This event does not exist or is no longer available." };
  return { kind: "unavailable", message: "The event service could not be reached. No registration was submitted." };
}

export default function EventRegistrationPage() {
  const router = useRouter();
  const params = useSearchParams();
  const eventId = (params.get("eventId") || "").trim();
  const { setCurrentUser, setCurrentRole, setCurrentEvent } = useAppStore();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    if (!eventId) {
      setFailure({ kind: "not-found", message: "This registration link is missing its event ID. Return to the event portal and use the organizer's current link." });
      setLoading(false);
      return () => { active = false; };
    }
    eventsApi.getPublicById(eventId).then((loaded) => {
      if (!active) return;
      setEvent(loaded);
      setCurrentEvent(loaded);
    }).catch((error: unknown) => {
      if (active) setFailure(classify(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [eventId, setCurrentEvent]);

  const deadline = event?.registrationDeadline ? Date.parse(event.registrationDeadline) : Number.NaN;
  const registrationOpen = event?.status?.toUpperCase() === "PUBLISHED" && Number.isFinite(deadline) && deadline > Date.now();

  const handleRegister = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!eventId || !registrationOpen) return;
    setBusy(true);
    setNotice("");
    setFailure(null);
    try {
      const session = await authApi.login(email, password, "PARTICIPANT");
      setCurrentUser(session.user);
      setCurrentRole(session.user.role);
      const result = await authApi.registerForEvent(eventId);
      setCurrentUser(result.session.user);
      setCurrentRole(result.session.user.role);
      router.push(`/events/registration-status?eventId=${encodeURIComponent(eventId)}&state=registered`);
    } catch (error) {
      const status = error && typeof error === "object" && "status" in error ? Number((error as {status?: unknown}).status) : undefined;
      const message = error instanceof Error ? error.message : "Registration could not be completed.";
      if (status === 401) {
        setFailure({ kind: "unavailable", message: "Email or password was not accepted. If you are new to EVENTOPS, create a participant account and return to this event link." });
      } else {
        setNotice(message);
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100"><LoaderCircle className="mr-3 h-5 w-5 animate-spin text-indigo-300" />Loading event registration…</main>;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-indigo-300">EVENTOPS 2026 · Participant registration</p>
          <h1 className="mt-2 text-2xl font-bold text-white">{event?.name || (failure?.kind === "not-found" ? "Event not found" : "Event unavailable")}</h1>
          {event && <p className="mt-2 font-mono text-xs text-slate-500">Event ID: {event.id}</p>}
        </header>
        {failure && <section role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4"><div className="flex gap-2"><CircleAlert className="h-5 w-5 shrink-0 text-rose-300" /><p className="text-sm text-rose-200">{failure.message}</p></div></section>}
        {notice && <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{notice}</p>}
        {event && (
          <section className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div><h2 className="font-semibold text-white">Sign in to enroll</h2><p className="mt-1 text-sm leading-6 text-slate-400">Use your existing participant account. A successful login alone does not register you; this form submits a separate event registration that the backend verifies and stores.</p></div>
            {!registrationOpen && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">New registration is unavailable because this event is unpublished, or its registration deadline is missing or has passed.</p>}
            {registrationOpen && <form onSubmit={handleRegister} className="space-y-4">
              <Input label="Participant email" type="email" autoComplete="email" value={email} onChange={(value) => setEmail(value)} required />
              <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(value) => setPassword(value)} required />
              <Button type="submit" variant="primary" disabled={busy}>{busy ? "Checking account and registering…" : "Sign in & register for this event"} <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </form>}
            <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-4">
              <Button variant="outline" onClick={() => router.push(`/register?accountType=PARTICIPANT&eventId=${encodeURIComponent(eventId)}`)}>Create participant account</Button>
              <Button variant="outline" onClick={() => router.push(`/events/portal?eventId=${encodeURIComponent(eventId)}`)}><ArrowLeft className="mr-2 h-4 w-4" />Event portal</Button>
            </div>
            <p className="text-xs leading-5 text-slate-500">Event ID is only context. Enrollment is confirmed only after an active participant membership is persisted by the backend. Team creation and staff assignment are separate workflows.</p>
          </section>
        )}
      </div>
    </main>
  );
}
