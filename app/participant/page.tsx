"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";
import { CalendarDays, CircleAlert, ClipboardCheck, ExternalLink, LoaderCircle, RefreshCw, Users } from "lucide-react";
import type { User } from "@/types";

type Registration = {
  eventId: string;
  eventName: string;
  status: string;
  registered?: boolean;
  registrationId?: string | null;
  createdAt?: string | null;
};
type PageState = "loading" | "ready" | "unauthenticated" | "forbidden" | "error";

function hasSession() {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("eventops_token") || sessionStorage.getItem("eventops_token"));
}
function errorText(error: unknown) {
  const message = error instanceof Error ? error.message : "Participant data could not be loaded.";
  if (/401|unauthenticated|authentication required|invalid, expired/i.test(message)) return "Your session is missing or expired. Sign in to view registrations linked to your account.";
  if (/403|forbidden|access denied/i.test(message)) return "This workspace is only available to the participant account authenticated for this session.";
  return message;
}

export default function ParticipantDashboardPage() {
  const params = useSearchParams();
  const eventId = (params.get("eventId") || "").trim();
  const [user, setUser] = useState<User | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selected, setSelected] = useState<Registration | null>(null);
  const [state, setState] = useState<PageState>("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setState("loading"); setError("");
    if (!hasSession()) {
      setUser(null); setRegistrations([]); setSelected(null); setState("unauthenticated"); return;
    }
    try {
      const currentUser = await authApi.getMe();
      if (currentUser.role !== "PARTICIPANT") { setUser(currentUser); setState("forbidden"); return; }
      const own = await authApi.getEventRegistrations();
      setUser(currentUser); setRegistrations(own);
      setSelected(eventId ? await authApi.getEventRegistration(eventId) : null);
      setState("ready");
    } catch (err) {
      const msg = errorText(err); setError(msg);
      if (/401|unauthenticated|authentication required|invalid, expired/i.test(err instanceof Error ? err.message : "")) setState("unauthenticated");
      else if (/403|forbidden|access denied/i.test(err instanceof Error ? err.message : "")) setState("forbidden");
      else setState("error");
    }
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);
  const signInHref = eventId ? `/events/login?eventId=${encodeURIComponent(eventId)}` : "/login";

  if (state === "loading") return <main className="flex min-h-[50vh] items-center justify-center gap-3 p-8 text-slate-300"><LoaderCircle className="h-5 w-5 animate-spin text-indigo-300" /><p className="text-sm">Loading your verified participant workspace…</p></main>;

  if (state === "unauthenticated") return (
    <main className="mx-auto max-w-2xl p-6"><section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-white">Participant sign-in required</h1>
      <p className="mt-3 text-sm leading-6 text-slate-300">{error || "Sign in to see registrations linked to your account. Creating an account alone does not enroll you in an event."}</p>
      <div className="mt-5 flex flex-wrap gap-3"><Link href={signInHref}><Button variant="primary">Sign in</Button></Link><Link href={eventId ? `/events/registration-status?eventId=${encodeURIComponent(eventId)}` : "/events"}><Button variant="outline">Browse events</Button></Link></div>
    </section></main>
  );

  if (state === "forbidden") return (
    <main className="mx-auto max-w-2xl p-6"><section className="rounded-2xl border border-amber-500/30 bg-slate-900 p-6">
      <div className="flex items-center gap-3"><CircleAlert className="h-5 w-5 text-amber-300" /><h1 className="text-xl font-bold text-white">Participant access unavailable</h1></div>
      <p className="mt-3 text-sm text-slate-300">{error || "The signed-in account is not a participant account. Use the workspace assigned to your verified role."}</p><Link className="mt-4 inline-block text-sm text-indigo-300 hover:underline" href="/">Return to home</Link>
    </section></main>
  );

  if (state === "error") return (
    <main className="mx-auto max-w-2xl p-6"><section className="space-y-4 rounded-2xl border border-rose-500/30 bg-slate-900 p-6">
      <div className="flex items-center gap-3"><CircleAlert className="h-5 w-5 text-rose-300" /><h1 className="text-xl font-bold text-white">Participant data unavailable</h1></div>
      <p role="alert" className="text-sm leading-6 text-slate-300">{error}</p><Button variant="outline" onClick={() => void load()} leftIcon={<RefreshCw className="h-4 w-4" />}>Retry</Button>
    </section></main>
  );

  const activeSelected = selected?.registered === true && String(selected.status || "").toUpperCase() === "ACTIVE";
  return <div className="space-y-6">
    <header className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div>
        <p className="text-xs font-mono uppercase tracking-widest text-indigo-300">Participant workspace</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Welcome, {user?.name || "Participant"}</h1>
        <p className="mt-2 text-sm text-slate-400">Only memberships returned for your authenticated account appear here.</p>
      </div><Button variant="outline" onClick={() => void load()} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button></div>
    </header>

    {eventId && <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <div className="flex items-start gap-3"><ClipboardCheck className="mt-1 h-5 w-5 shrink-0 text-indigo-300" /><div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-white">{selected?.eventName || "Selected event"}</h2><p className="mt-1 text-xs text-slate-500">Event ID: {eventId}</p>
        {activeSelected ? <p className="mt-3 text-sm text-emerald-300">Registration confirmed · {selected?.registrationId || "Active membership"}</p> : <p className="mt-3 text-sm text-amber-200">No active registration was confirmed for this event.</p>}
      </div></div>
      {!activeSelected && <Link href={`/events/registration-status?eventId=${encodeURIComponent(eventId)}`}><Button variant="primary">Check registration options</Button></Link>}
      <Link className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:underline" href={`/events/portal?eventId=${encodeURIComponent(eventId)}`}>Open event portal <ExternalLink className="h-3.5 w-3.5" /></Link>
    </section>}

    <section className="space-y-4">
      <div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-indigo-300" /><div><h2 className="text-lg font-semibold text-white">My event registrations</h2><p className="text-sm text-slate-400">Your account is separate from each event registration.</p></div></div>
      {registrations.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
        <Users className="mx-auto h-8 w-8 text-slate-500" /><h3 className="mt-3 font-semibold text-white">No event registrations found</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Enroll in a published event to see it here. Team membership, schedules, QR passes, attendance, and allocations will appear only when verified data is available.</p>
        <Link className="mt-4 inline-block" href="/events"><Button variant="primary">Browse events</Button></Link>
      </div> : <div className="grid gap-4 md:grid-cols-2">{registrations.map((item) => {
        const active = String(item.status).toUpperCase() === "ACTIVE";
        return <article key={item.eventId} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-white">{item.eventName || "Event"}</h3><span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${active ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>{item.status || "UNKNOWN"}</span></div>
          <p className="text-xs text-slate-500">Event ID: {item.eventId}</p>{item.createdAt && <p className="text-xs text-slate-400">Registered {new Date(item.createdAt).toLocaleDateString()}</p>}
          <div className="flex flex-wrap gap-2"><Link href={`/participant?eventId=${encodeURIComponent(item.eventId)}`}><Button size="sm" variant="primary">Open workspace</Button></Link><Link href={`/events/portal?eventId=${encodeURIComponent(item.eventId)}`}><Button size="sm" variant="outline">Event portal</Button></Link></div>
        </article>;
      })}</div>}
    </section>

    <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"><h2 className="font-semibold text-white">Other participant features</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">Team creation or invitation, project submission, schedules, QR passes, attendance, results, and venue allocation are not shown as completed because these features are not yet connected here to verified participant-scoped APIs.</p>
    </section>
  </div>;
}
