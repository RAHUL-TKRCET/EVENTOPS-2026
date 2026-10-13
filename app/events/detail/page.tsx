"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import { apiRequest } from "@/lib/api/config";
import { eventsApi } from "@/lib/api/events";
import { EventItem } from "@/types";
import {
  Calendar, Users, Building, Settings, Layers, Clock, ShieldCheck, Trophy,
  ArrowRight, UserPlus, Copy, ExternalLink, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Input, Textarea } from "@/components/ui/Input";
import { useAppStore } from "@/store";

type EventMetrics = {
  totalTeams: number;
  checkedInTeams: number;
  checkInRate: string;
  activeVenues: number;
  submittedEvaluations: number;
  openIncidents: number;
  systemHealth: string;
};

type EventMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  title?: string;
  zoneOrDept?: string;
  status: string;
};

type ApiFailure = {
  kind: "unauthenticated" | "forbidden" | "not-found" | "unavailable" | "unknown";
  message: string;
};

function classifyFailure(error: unknown): ApiFailure {
  const message = error instanceof Error ? error.message : "The event could not be loaded.";
  const status = error && typeof error === "object" && "status" in error
    ? Number((error as { status?: unknown }).status)
    : undefined;
  if (status === 401 || /401|unauthenticated|authentication required|invalid, expired/i.test(message)) {
    return { kind: "unauthenticated", message: "Your session is missing or expired. Sign in again to access event administration." };
  }
  if (status === 403 || /403|forbidden|access denied|cannot administer|cross-organization/i.test(message)) {
    return { kind: "forbidden", message: "Your account does not have access to this event. Sign in with an active Organization Admin account for the organization that owns it." };
  }
  if (status === 404 || /404|not found/i.test(message)) {
    return { kind: "not-found", message: "This event could not be found. Check the event link or return to your Events list." };
  }
  if (/could not reach the API|network|failed to fetch|endpoint:/i.test(message)) {
    return { kind: "unavailable", message: "The event service could not be reached. Check connectivity and the configured backend, then retry." };
  }
  return { kind: "unknown", message };
}

function toPortalRoute(eventId: string): string {
  return `/events/portal?eventId=${encodeURIComponent(eventId)}`;
}
function toEventLoginRoute(eventId: string): string {
  return `/events/login?eventId=${encodeURIComponent(eventId)}`;
}


function EventSettingsForm({ event, onSaved }: { event: EventItem; onSaved: (event: EventItem) => void }) {
  const [name, setName] = useState(event.name);
  const [description, setDescription] = useState(event.description || "");
  const [location, setLocation] = useState(event.location || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setName(event.name);
    setDescription(event.description || "");
    setLocation(event.location || "");
  }, [event.id, event.name, event.description, event.location]);
  const save = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const updated = await eventsApi.update(event.id, { name, description, location });
      onSaved(updated);
      setNotice("Event settings saved to the backend.");
    } catch (saveError) {
      setError(classifyFailure(saveError).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={save} className="space-y-4">
      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
      <Input label="Event name" value={name} onChange={(event) => setName(event.target.value)} required />
      <Textarea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
      <Input label="Location" value={location} onChange={(event) => setLocation(event.target.value)} />
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">Only fields supported by the backend update endpoint can be saved. Branding, access flags, and other settings remain unavailable until their write APIs exist.</div>
      <Button type="submit" variant="primary" disabled={busy}>{busy ? "Saving…" : "Save event settings"}</Button>
    </form>
  );
}

export default function StaticEventDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = (searchParams.get("eventId") || "").trim();
  const section = (searchParams.get("section") || "").trim().toLowerCase();
  const { currentRole } = useAppStore();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [metrics, setMetrics] = useState<EventMetrics | null>(null);
  const [members, setMembers] = useState<EventMember[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [metricsUnavailable, setMetricsUnavailable] = useState(false);
  const [membersUnavailable, setMembersUnavailable] = useState(false);
  const [copiedPortal, setCopiedPortal] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [lifecycleNotice, setLifecycleNotice] = useState("");

  const loadEvent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setEvent(null);
    setMetrics(null);
    setMembers(null);
    setMetricsUnavailable(false);
    setMembersUnavailable(false);

    if (!eventId) {
      setError({ kind: "not-found", message: "The event link is missing its eventId query parameter. Open the event from the Events list or ask an administrator for a new link." });
      setIsLoading(false);
      return;
    }
    try {
      const loadedEvent = await eventsApi.getById(eventId);
      setEvent(loadedEvent);
      const results = await Promise.allSettled([
        apiRequest<EventMetrics>(`/analytics/overview?eventId=${encodeURIComponent(eventId)}`),
        eventsApi.getMembers(eventId),
      ]);
      const metricsResult = results[0];
      if (metricsResult.status === "fulfilled") setMetrics(metricsResult.value);
      else {
        const failure = classifyFailure(metricsResult.reason);
        if (failure.kind === "unauthenticated" || failure.kind === "forbidden") {
          setError(failure); setEvent(null); return;
        }
        setMetricsUnavailable(true);
      }
      const membersResult = results[1];
      if (membersResult.status === "fulfilled") setMembers(membersResult.value);
      else {
        const failure = classifyFailure(membersResult.reason);
        if (failure.kind === "unauthenticated" || failure.kind === "forbidden") {
          setError(failure); setEvent(null); return;
        }
        setMembersUnavailable(true);
      }
    } catch (loadError) {
      setError(classifyFailure(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void loadEvent(); }, [loadEvent]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const base = `${origin}${basePath}`;
  const portalUrl = event ? `${base}${toPortalRoute(event.id)}` : "";
  const loginUrl = event ? `${base}${toEventLoginRoute(event.id)}` : "";
  const roleBreakdown = members?.reduce<Record<string, number>>((counts, member) => {
    const role = String(member.role || "UNKNOWN").toUpperCase();
    counts[role] = (counts[role] || 0) + 1;
    return counts;
  }, {}) ?? {};

  const copy = async (value: string, kind: "portal" | "login") => {
    try {
      await navigator.clipboard.writeText(value);
      if (kind === "portal") setCopiedPortal(true); else setCopiedLogin(true);
      window.setTimeout(() => { if (kind === "portal") setCopiedPortal(false); else setCopiedLogin(false); }, 2000);
    } catch {
      setError({ kind: "unknown", message: "Clipboard access is unavailable. Select and copy the link manually." });
    }
  };

  if (isLoading) return <div className="rounded-2xl border border-slate-800 p-8 text-center text-sm text-slate-400">Loading event from your authorized organization…</div>;
  if (error || !event) {
    const failure = error ?? { kind: "not-found" as const, message: "This event could not be loaded." };
    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="font-mono text-lg font-bold text-white">{failure.kind === "unauthenticated" ? "Sign-in required" : failure.kind === "forbidden" ? "Access denied" : failure.kind === "not-found" ? "Event not found" : "Unable to open event hub"}</h2>
        <p role="alert" className="text-sm text-slate-300">{failure.message}</p>
        <div className="flex flex-wrap gap-2">
          {failure.kind === "unauthenticated" && <Button variant="primary" onClick={() => router.push(`/events/login?eventId=${encodeURIComponent(eventId)}`)}>Sign in</Button>}
          <Button variant="outline" onClick={() => void loadEvent()}>Retry</Button>
          <Button variant="outline" onClick={() => router.push("/events")}>Back to Events</Button>
        </div>
      </div>
    );
  }

  const dateLabel = (value: string | undefined) => {
    if (!value) return "Not configured";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "Not configured" : parsed.toLocaleString();
  };
  const sectionDefinitions = [
    { id: "rounds", title: "Rounds & timeline", description: "Configured event rounds and progression quotas.", icon: <Layers className="w-5 h-5 text-indigo-400" /> },
    { id: "timeslots", title: "Time slots", description: "Configured scheduling windows and capacity.", icon: <Clock className="w-5 h-5 text-sky-400" /> },
    { id: "criteria", title: "Evaluation criteria", description: "Criteria configured within each event round.", icon: <Trophy className="w-5 h-5 text-amber-400" /> },
    { id: "rules", title: "Event rules & safety", description: "Persisted eligibility and code-of-conduct rules.", icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
    { id: "settings", title: "Event settings", description: "Event metadata managed through the event API.", icon: <Settings className="w-5 h-5 text-slate-400" /> },
  ];
  const selectedSection = sectionDefinitions.find((item) => item.id === section) ?? null;
  const submodules = [
    { title: "People & role assignments", desc: "Add judges, volunteers, coordinators and event staff", href: `/people?eventId=${encodeURIComponent(event.id)}`, icon: <UserPlus className="w-5 h-5 text-sky-400" /> },
    ...sectionDefinitions.map((item) => ({ title: item.title, desc: item.description, href: `/events/detail?eventId=${encodeURIComponent(event.id)}&section=${item.id}`, icon: item.icon })),
  ];;

  return (
    <div className="space-y-6">
      {selectedSection && (
        <section className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-2">{selectedSection.icon}</div>
            <div className="flex-1"><h3 className="text-base font-semibold text-white">{selectedSection.title}</h3><p className="mt-1 text-sm text-slate-400">{selectedSection.description}</p></div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/events/detail?eventId=${encodeURIComponent(event.id)}`)}>Back to overview</Button>
          </div>
          {section === "rounds" && (event.rounds?.length ? <div className="space-y-3">{event.rounds.map((round) => (
            <div key={round.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold text-white">{round.order}. {round.name}</h4><StatusBadge status={round.status} /></div>
              <p className="text-xs text-slate-400">{dateLabel(round.startTime)} – {dateLabel(round.endTime)}</p><p className="text-xs text-slate-300">Advancement quota: {round.qualifyingQuota}</p><p className="text-xs text-slate-400">{round.criteria?.length ?? 0} configured criteria</p>
            </div>
          ))}</div> : <p className="text-sm text-slate-400">No rounds are configured for this event yet.</p>)}
          {section === "timeslots" && (event.timeSlots?.length ? <div className="grid gap-3 sm:grid-cols-2">{event.timeSlots.map((slot) => (
            <div key={slot.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2"><h4 className="font-semibold text-white">{slot.label}</h4><p className="text-xs text-slate-400">{dateLabel(slot.startTime)} – {dateLabel(slot.endTime)}</p><p className="text-xs text-slate-300">Capacity: {slot.capacity}</p></div>
          ))}</div> : <p className="text-sm text-slate-400">No time slots are configured for this event yet.</p>)}
          {section === "criteria" && (event.rounds?.some((round) => round.criteria?.length) ? <div className="space-y-4">{event.rounds.flatMap((round) => round.criteria.map((criterion) => ({ ...criterion, roundName: round.name, roundId: round.id }))).map((criterion) => (
            <div key={`${criterion.roundId}-${criterion.id}`} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
              <div className="flex flex-wrap justify-between gap-2"><h4 className="font-semibold text-white">{criterion.name}</h4><span className="text-xs text-indigo-300">Max score: {criterion.maxScore}</span></div><p className="text-xs text-slate-400">Round: {criterion.roundName} · Weight: {(criterion.weight * 100).toFixed(1)}%</p><p className="text-sm text-slate-300">{criterion.description || "No description provided."}</p>
            </div>
          ))}</div> : <p className="text-sm text-slate-400">No evaluation criteria are configured for this event yet.</p>)}
          {section === "rules" && (event.rules?.length ? <div className="space-y-3">{event.rules.map((rule, index) => (
            <div key={`${rule.title}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-white">{rule.title}</h4><span className="text-xs text-slate-400">{rule.category}</span>{rule.isMandatory && <span className="text-xs text-amber-300">Mandatory</span>}</div><p className="text-sm text-slate-300">{rule.description}</p></div>
          ))}</div> : <p className="text-sm text-slate-400">No rules are configured for this event yet.</p>)}
          {section === "settings" && <EventSettingsForm event={event} onSaved={setEvent} />}
          {section !== "settings" && <p className="text-xs text-slate-500">Displayed from the authorized event API response. Changes are available only through implemented backend write endpoints.</p>}
        </section>
      )}
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push("/events")}>← Back to Events</Button>
        <Button variant="outline" size="sm" onClick={() => void loadEvent()}>Refresh event</Button>
      </div>
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-indigo-400 font-bold uppercase">{event.id}</span>
              <StatusBadge status={event.status || "DRAFT"} />
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">{event.type}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-mono text-white mt-1">{event.name}</h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">{event.description || "No description provided."}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={() => router.push(`/people?eventId=${encodeURIComponent(event.id)}`)} leftIcon={<UserPlus className="w-3.5 h-3.5 text-sky-400" />}>Manage Staff / Roles</Button>
            <Button variant="primary" size="sm" onClick={() => router.push("/control-center")}>Enter Control Center</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div><span className="text-slate-500 text-[11px]">Starts</span><p className="font-mono font-medium text-slate-200">{dateLabel(event.startDate)}</p></div>
          <div><span className="text-slate-500 text-[11px]">Ends</span><p className="font-mono font-medium text-slate-200">{dateLabel(event.endDate)}</p></div>
          <div><span className="text-slate-500 text-[11px]">Registration deadline</span><p className="font-mono font-medium text-slate-200">{dateLabel(event.registrationDeadline)}</p></div>
          <div><span className="text-slate-500 text-[11px]">Current stage</span><p className="font-mono font-bold text-indigo-400">{event.currentRound ? `Round ${event.currentRound} of ${event.totalRounds || "—"}` : "Not started"}</p></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-indigo-500/30 bg-slate-900/90 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between gap-2"><div><span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold uppercase">Public event portal</span><p className="text-xs text-slate-400 mt-1">Approved public details and schedules</p></div><Button size="sm" variant="outline" onClick={() => void copy(portalUrl, "portal")} leftIcon={copiedPortal ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}>{copiedPortal ? "Copied!" : "Copy"}</Button></div>
          <p className="font-mono text-xs text-sky-300 select-all break-all bg-slate-950 p-2 rounded-lg border border-slate-800">{portalUrl}</p>
          <button onClick={() => window.open(portalUrl, "_blank", "noopener,noreferrer")} className="text-xs font-mono text-indigo-400 hover:text-white flex items-center gap-1">Open <ExternalLink className="w-3 h-3" /></button>
        </div>
        <div className="p-5 rounded-2xl border border-teal-500/30 bg-slate-900/90 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between gap-2"><div><span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 border border-teal-500/30 text-teal-300 font-bold uppercase">Role login terminal</span><p className="text-xs text-slate-400 mt-1">Organization admins use organization login; event roles require an assignment</p></div><Button size="sm" variant="outline" onClick={() => void copy(loginUrl, "login")} leftIcon={copiedLogin ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}>{copiedLogin ? "Copied!" : "Copy"}</Button></div>
          <p className="font-mono text-xs text-teal-300 select-all break-all bg-slate-950 p-2 rounded-lg border border-slate-800">{loginUrl}</p>
          <button onClick={() => window.open(loginUrl, "_blank", "noopener,noreferrer")} className="text-xs font-mono text-teal-400 hover:text-white flex items-center gap-1">Open <ExternalLink className="w-3 h-3" /></button>
        </div>
      </div>
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div><h3 className="text-sm font-bold text-white font-mono flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-sky-400" />Event operational overview</h3><p className="text-xs text-slate-400">Only verified backend data is shown for {event.name}.</p></div>
          <Button size="sm" variant="outline" onClick={() => router.push(`/people?eventId=${encodeURIComponent(event.id)}`)} rightIcon={<UserPlus className="w-3.5 h-3.5" />}>Manage Staff</Button>
        </div>
        {metricsUnavailable || !metrics ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">Operational metrics are unavailable. The event itself loaded successfully; no sample metrics are shown.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KPICard title="Registered teams" value={metrics.totalTeams} subtitle="From authorized analytics API" icon={<Users className="h-4 w-4 text-indigo-400" />} />
            <KPICard title="Checked-in teams" value={metrics.checkedInTeams} subtitle={metrics.checkInRate + " check-in rate"} icon={<Calendar className="h-4 w-4 text-emerald-400" />} />
            <KPICard title="Active venues" value={metrics.activeVenues} subtitle="From authorized analytics API" icon={<Building className="h-4 w-4 text-sky-400" />} />
            <KPICard title="Open incidents" value={metrics.openIncidents} subtitle="From authorized analytics API" icon={<ShieldCheck className="h-4 w-4 text-amber-400" />} />
          </div>
        )}
      </div>
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div><h3 className="text-sm font-bold text-white font-mono flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" />Enrolled roles & staff roster</h3><p className="text-xs text-slate-400">Personnel delegated and authorized for this event.</p></div>
          <Link href={`/people?eventId=${encodeURIComponent(event.id)}`} className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1">Manage staff <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
        {membersUnavailable || !members ? (
          <p className="text-sm text-slate-400">The event roster is unavailable. Verify the memberships API and retry.</p>
        ) : members.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3"><UserPlus className="w-8 h-8 text-slate-500 mx-auto" /><p className="text-xs text-slate-400">No staff members enrolled yet for this event.</p><Button size="sm" variant="outline" onClick={() => router.push(`/people?eventId=${encodeURIComponent(event.id)}`)}>Add Staff / Roles</Button></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]"><tr><th className="py-2.5 px-3">Name</th><th className="py-2.5 px-3">Role</th><th className="py-2.5 px-3">Email</th><th className="py-2.5 px-3">Title / Zone</th><th className="py-2.5 px-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">{members.slice(0, 5).map((member) => <tr key={member.id} className="hover:bg-slate-800/30 transition"><td className="py-2.5 px-3 font-medium text-white">{member.name}</td><td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{member.role}</span></td><td className="py-2.5 px-3 text-slate-400">{member.email}</td><td className="py-2.5 px-3 text-slate-400">{member.title || member.zoneOrDept || "—"}</td><td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">{member.status}</span></td></tr>)}</tbody>
          </table></div>
        )}
      </div>
      <div><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Event configuration & rules modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {submodules.map((mod) => <Link key={mod.href} href={mod.href} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800/80 hover:border-slate-700 transition flex items-start justify-between group cursor-pointer"><div className="space-y-1"><div className="p-2.5 rounded-xl bg-slate-800 w-fit border border-slate-700/60 mb-2">{mod.icon}</div><h4 className="text-sm font-semibold text-slate-100 group-hover:text-white">{mod.title}</h4><p className="text-xs text-slate-400">{mod.desc}</p></div><ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" /></Link>)}
        </div>
      </div>
    </div>
  );
}
