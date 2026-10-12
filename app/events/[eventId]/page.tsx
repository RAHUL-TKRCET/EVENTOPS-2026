"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { KPICard } from "@/components/ui/KPICard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import {
  Calendar, Users, Building, Settings, Layers, Clock, ShieldCheck, Trophy,
  ArrowRight, UserPlus, Copy, ExternalLink, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { eventsApi } from "@/lib/api/events";
import { apiRequest } from "@/lib/api/config";
import { EventItem } from "@/types";

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
  if (/401|unauthenticated|authentication required/i.test(message)) {
    return { kind: "unauthenticated", message: "Your session is missing or expired. Sign in again to access event administration." };
  }
  if (/403|forbidden|access denied|cannot administer/i.test(message)) {
    return { kind: "forbidden", message: "Your account does not have access to this event. Verify that you are signed in to the correct organization." };
  }
  if (/404|not found/i.test(message)) {
    return { kind: "not-found", message: "This event could not be found. Check the event link or return to your Events list." };
  }
  if (/could not reach the API|network|failed to fetch|endpoint:/i.test(message)) {
    return { kind: "unavailable", message: "The event service could not be reached. Check connectivity and the configured backend, then retry." };
  }
  return { kind: "unknown", message };
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawEventId = params.eventId;
  const eventId = Array.isArray(rawEventId) ? rawEventId[0] : String(rawEventId ?? "");

  const [event, setEvent] = useState<EventItem | null>(null);
  const [metrics, setMetrics] = useState<EventMetrics | null>(null);
  const [members, setMembers] = useState<EventMember[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [metricsUnavailable, setMetricsUnavailable] = useState(false);
  const [membersUnavailable, setMembersUnavailable] = useState(false);
  const [copiedPortal, setCopiedPortal] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);

  const loadEvent = async () => {
    setIsLoading(true);
    setError(null);
    setEvent(null);
    setMetrics(null);
    setMembers(null);
    setMetricsUnavailable(false);
    setMembersUnavailable(false);

    if (!eventId) {
      setError({ kind: "not-found", message: "No event identifier was provided." });
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
      const membersResult = results[1];

      if (metricsResult.status === "fulfilled") {
        setMetrics(metricsResult.value);
      } else {
        const failure = classifyFailure(metricsResult.reason);
        if (failure.kind === "unauthenticated" || failure.kind === "forbidden") {
          setError(failure);
          setEvent(null);
          return;
        }
        setMetricsUnavailable(true);
      }

      if (membersResult.status === "fulfilled") {
        setMembers(membersResult.value);
      } else {
        const failure = classifyFailure(membersResult.reason);
        if (failure.kind === "unauthenticated" || failure.kind === "forbidden") {
          setError(failure);
          setEvent(null);
          return;
        }
        setMembersUnavailable(true);
      }
    } catch (loadError) {
      setError(classifyFailure(loadError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEvent();
    // Refresh when the selected route id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const base = `${origin}${basePath}`;
  const portalUrl = event ? `${base}/events/${encodeURIComponent(event.id)}/portal` : "";
  const loginUrl = event ? `${base}/events/${encodeURIComponent(event.id)}/login` : "";

  const copyToClipboard = async (text: string, type: "portal" | "login") => {
    if (!text || typeof navigator === "undefined" || !navigator.clipboard) {
      setError({ kind: "unknown", message: "Clipboard access is unavailable in this browser. Copy the link manually." });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      if (type === "portal") setCopiedPortal(true);
      else setCopiedLogin(true);
      window.setTimeout(() => {
        if (type === "portal") setCopiedPortal(false);
        else setCopiedLogin(false);
      }, 2000);
    } catch {
      setError({ kind: "unknown", message: "The link could not be copied. Copy it manually instead." });
    }
  };

  const roleBreakdown = members?.reduce<Record<string, number>>((counts, member) => {
    const role = String(member.role || "UNKNOWN").toUpperCase();
    counts[role] = (counts[role] || 0) + 1;
    return counts;
  }, {}) ?? {};

  const submodules = event ? [
    { title: "Enrolled Roles & Delegation", desc: "Add Volunteers, Judges, Coordinators & Staff", href: `/people?eventId=${encodeURIComponent(event.id)}`, icon: <UserPlus className="w-5 h-5 text-sky-400" /> },
    { title: "Rounds & Timeline", desc: "Progression quotas & schedule", href: `/events/${event.id}/rounds`, icon: <Layers className="w-5 h-5 text-indigo-400" /> },
    { title: "Time Slots", desc: "Capacity windows & pitch intervals", href: `/events/${event.id}/timeslots`, icon: <Clock className="w-5 h-5 text-sky-400" /> },
    { title: "Evaluation Criteria", desc: "Dynamic rubrics & scoring weights", href: `/events/${event.id}/criteria`, icon: <Trophy className="w-5 h-5 text-amber-400" /> },
    { title: "Event Rules & Safety", desc: "Eligibility & code of conduct", href: `/events/${event.id}/rules`, icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
    { title: "Event Settings", desc: "Metadata, banner & access flags", href: `/events/${event.id}/settings`, icon: <Settings className="w-5 h-5 text-slate-400" /> },
  ] : [];

  if (isLoading) {
    return <div className="rounded-2xl border border-slate-800 p-8 text-center text-sm text-slate-400">Loading event from your authorized workspace…</div>;
  }

  if (error || !event) {
    const failure = error ?? { kind: "not-found" as const, message: "This event could not be loaded." };
    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="font-mono text-lg font-bold text-white">
          {failure.kind === "unauthenticated" ? "Sign-in required" : failure.kind === "forbidden" ? "Access denied" : failure.kind === "not-found" ? "Event not found" : "Unable to open event hub"}
        </h2>
        <p role="alert" className="text-sm text-slate-300">{failure.message}</p>
        <div className="flex flex-wrap gap-2">
          {failure.kind === "unauthenticated" && <Button variant="primary" onClick={() => router.push("/login")}>Sign in</Button>}
          <Button variant="outline" onClick={() => void loadEvent()}>Retry</Button>
          <Button variant="outline" onClick={() => router.push("/events")}>Back to Events</Button>
        </div>
      </div>
    );
  }

  const dateLabel = (value: string | undefined) => {
    if (!value) return "Not configured";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Not configured" : date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push("/events")}>← Back to Events</Button>
        <Button variant="outline" size="sm" onClick={() => void loadEvent()}>Refresh event</Button>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-indigo-400 font-bold uppercase">{event.id}</span>
              <StatusBadge status={event.status || "DRAFT"} />
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">{event.type}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-mono text-white mt-1">{event.name}</h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">{event.description || "No description provided."}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={() => router.push(`/people?eventId=${encodeURIComponent(event.id)}`)} leftIcon={<UserPlus className="w-3.5 h-3.5 text-sky-400" />}>Add Staff / Roles</Button>
            <Button variant="primary" size="sm" onClick={() => router.push("/control-center")}>Enter Control Center</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div><span className="text-slate-500 text-[11px]">Starts</span><p className="font-mono font-medium text-slate-200">{dateLabel(event.startDate)}</p></div>
          <div><span className="text-slate-500 text-[11px]">Ends</span><p className="font-mono font-medium text-slate-200">{dateLabel(event.endDate)}</p></div>
          <div><span className="text-slate-500 text-[11px]">Registration Deadline</span><p className="font-mono font-medium text-slate-200">{dateLabel(event.registrationDeadline)}</p></div>
          <div><span className="text-slate-500 text-[11px]">Current Stage</span><p className="font-mono font-bold text-indigo-400">{event.currentRound ? `Round ${event.currentRound} of ${event.totalRounds || "—"}` : "Not started"}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-indigo-500/30 bg-slate-900/90 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold uppercase">Public Event Portal</span><span className="text-xs text-slate-400">Details & Schedules</span></div>
            <Button size="sm" variant="outline" onClick={() => void copyToClipboard(portalUrl, "portal")} leftIcon={copiedPortal ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}>{copiedPortal ? "Copied!" : "Copy"}</Button>
          </div>
          <p className="font-mono text-xs text-sky-300 select-all truncate bg-slate-950 p-2 rounded-lg border border-slate-800">{portalUrl}</p>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400">Public link for participants, audiences & press.</p>
            <button onClick={() => window.open(portalUrl, "_blank", "noopener,noreferrer")} className="text-xs font-mono text-indigo-400 hover:text-white flex items-center gap-1">Open <ExternalLink className="w-3 h-3" /></button>
          </div>
        </div>
        <div className="p-5 rounded-2xl border border-teal-500/30 bg-slate-900/90 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 border border-teal-500/30 text-teal-300 font-bold uppercase">Role Login Terminal</span><span className="text-xs text-slate-400">Staff Authentication</span></div>
            <Button size="sm" variant="outline" onClick={() => void copyToClipboard(loginUrl, "login")} leftIcon={copiedLogin ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}>{copiedLogin ? "Copied!" : "Copy"}</Button>
          </div>
          <p className="font-mono text-xs text-teal-300 select-all truncate bg-slate-950 p-2 rounded-lg border border-slate-800">{loginUrl}</p>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400">For enrolled event roles only.</p>
            <button onClick={() => window.open(loginUrl, "_blank", "noopener,noreferrer")} className="text-xs font-mono text-teal-400 hover:text-white flex items-center gap-1">Open <ExternalLink className="w-3 h-3" /></button>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-sky-400" />Event operational overview</h3>
            <p className="text-xs text-slate-400">Only backend responses are shown for {event.name}.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => router.push(`/people?eventId=${encodeURIComponent(event.id)}`)} rightIcon={<UserPlus className="w-3.5 h-3.5" />}>Manage Staff</Button>
        </div>
        {metricsUnavailable || !metrics ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">Operational metrics are unavailable. The event itself loaded successfully; retry to load current counts.</div>
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
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-slate-500 text-[11px] uppercase">Staff by role:</span>
              {["VOLUNTEER", "JUDGE", "COORDINATOR", "TECHNICAL_STAFF", "RESOURCE_MANAGER"].map((role) => (
                <span key={role} className="px-2.5 py-0.5 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300">{role.replaceAll("_", " ")}: {roleBreakdown[role] ?? 0}</span>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]"><tr><th className="py-2.5 px-3">Name</th><th className="py-2.5 px-3">Role</th><th className="py-2.5 px-3">Email</th><th className="py-2.5 px-3">Title / Zone</th><th className="py-2.5 px-3">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {members.slice(0, 5).map((member) => <tr key={member.id} className="hover:bg-slate-800/30 transition"><td className="py-2.5 px-3 font-medium text-white">{member.name}</td><td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{member.role}</span></td><td className="py-2.5 px-3 text-slate-400">{member.email}</td><td className="py-2.5 px-3 text-slate-400">{member.title || member.zoneOrDept || "—"}</td><td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">{member.status}</span></td></tr>)}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Event configuration & rules modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {submodules.map((mod) => <Link key={mod.href} href={mod.href} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800/80 hover:border-slate-700 transition flex items-start justify-between group cursor-pointer"><div className="space-y-1"><div className="p-2.5 rounded-xl bg-slate-800 w-fit border border-slate-700/60 mb-2">{mod.icon}</div><h4 className="text-sm font-semibold text-slate-100 group-hover:text-white">{mod.title}</h4><p className="text-xs text-slate-400">{mod.desc}</p></div><ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" /></Link>)}
        </div>
      </div>
    </div>
  );
}
