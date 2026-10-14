"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { eventsApi } from "@/lib/api/events";
import { useAppStore } from "@/store";
import { EventItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, ArrowRight, CircleAlert, LoaderCircle, CheckCircle2, Mail } from "lucide-react";

type Failure = { kind: "not-found" | "unavailable"; message: string };
type PublicRegistrationResult = {
  eventId: string;
  eventName: string;
  registrationId: string;
  status: string;
  emailStatus: "sent" | "pending" | "unavailable";
  message: string;
};
function classify(error: unknown): Failure {
  const status = error && typeof error === "object" && "status" in error ? Number((error as {status?: unknown}).status) : undefined;
  const message = error instanceof Error ? error.message : "Unable to load the event.";
  if (status === 404 || /404|not found/i.test(message)) return { kind: "not-found", message: "This event does not exist or is no longer available." };
  return { kind: "unavailable", message: "The event service could not be reached. Check the connection and try again." };
}

export default function EventRegistrationPage() {
  const router = useRouter();
  const params = useSearchParams();
  const eventId = (params.get("eventId") || "").trim();
  const { setCurrentEvent } = useAppStore();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organizationOrSchool, setOrganizationOrSchool] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [registration, setRegistration] = useState<PublicRegistrationResult | null>(null);

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
  const isPublished = event?.status?.toUpperCase() === "PUBLISHED";
  const hasValidDeadline = Number.isFinite(deadline);
  const registrationOpen = isPublished && hasValidDeadline && deadline > Date.now();

  const registrationClosedMessage = !isPublished
    ? `This event is currently ${event?.status || "unpublished"}. The organizer must publish it before new registration is available.`
    : !event?.registrationDeadline || !hasValidDeadline
      ? "Registration is unavailable because the event does not have a valid registration deadline. Contact the organizer."
      : "The registration deadline has passed. New registration is closed; contact the organizer if you think this is incorrect.";

  const handleRegister = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    if (!eventId || !registrationOpen || busy) return;
    setBusy(true);
    setNotice("");
    setFailure(null);
    try {
      const result = await authApi.registerForPublicEvent({
        eventId,
        name,
        email,
        phone,
        organizationOrSchool,
      });
      setRegistration(result);
    } catch (error) {
      const status = error && typeof error === "object" && "status" in error ? Number((error as {status?: unknown}).status) : undefined;
      const message = error instanceof Error ? error.message : "Registration could not be completed.";
      if (status === 409) {
        setNotice("We could not complete this registration with the submitted details. If you have registered before or already use EVENTOPS, contact the organizer to safely recover or link your account.");
      } else if (status === 503) {
        setNotice("Registration was not completed because email delivery is not available right now. Your information was not saved; please retry later or contact the organizer.");
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

        {registration ? (
          <section role="status" className="space-y-4 rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-6">
            <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-300" /><div><h2 className="text-lg font-semibold text-white">Registration successful</h2><p className="mt-2 text-sm leading-6 text-slate-300">Your participant space for {registration.eventName} has been created.</p></div></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3"><p className="text-xs text-slate-500">Registration reference</p><p className="mt-1 break-all font-mono text-sm text-slate-200">{registration.registrationId}</p></div>
            <div className="flex gap-3 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3"><Mail className="h-5 w-5 shrink-0 text-sky-300" /><div><p className="text-sm font-semibold text-white">Login details</p><p className="mt-1 text-sm leading-6 text-slate-300">{registration.message} Check your inbox and spam/junk folder for the EVENTOPS email.</p></div></div>
            <Button type="button" variant="primary" onClick={() => router.push(`/participant/login?eventId=${encodeURIComponent(eventId)}`)}>Go to participant login <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Button type="button" variant="outline" onClick={() => router.push(`/events/portal?eventId=${encodeURIComponent(eventId)}`)}><ArrowLeft className="mr-2 h-4 w-4" />Event portal</Button>
          </section>
        ) : (
          <section className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div><h2 className="font-semibold text-white">Register for this event</h2><p className="mt-1 text-sm leading-6 text-slate-400">No account or sign-in is required. Submitting this form creates your participant space for this event and emails your login details.</p></div>
            {!registrationOpen && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{registrationClosedMessage}</p>}
            {registrationOpen && (
              <form onSubmit={handleRegister} className="space-y-4">
                <Input label="Full name" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={255} required />
                <Input label="Participant email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                <Input label="Phone (optional)" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={50} />
                <Input label="College / organization (optional)" type="text" autoComplete="organization" value={organizationOrSchool} onChange={(event) => setOrganizationOrSchool(event.target.value)} maxLength={255} />
                <Button type="submit" variant="primary" disabled={busy} isLoading={busy}>
                  {busy ? "Registering and sending login details…" : "Register for this event"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            )}
            <div className="border-t border-slate-800 pt-4"><Button type="button" variant="outline" onClick={() => router.push(`/events/portal?eventId=${encodeURIComponent(eventId)}`)}><ArrowLeft className="mr-2 h-4 w-4" />Event portal</Button></div>
            <p className="text-xs leading-5 text-slate-500">Your credentials are generated securely by the system. Staff assignment and team creation are separate workflows. Existing accounts are never silently overwritten or given a different role.</p>
          </section>
        )}
      </div>
    </main>
  );
}
