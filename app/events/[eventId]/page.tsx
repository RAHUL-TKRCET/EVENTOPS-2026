"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockEvents } from "@/lib/mock-data/events";
import { KPICard } from "@/components/ui/KPICard";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import {
  Calendar,
  Users,
  Building,
  Scale,
  Settings,
  Layers,
  Clock,
  ShieldCheck,
  Trophy,
  ArrowRight,
  Sparkles,
  UserPlus,
  Copy,
  ExternalLink,
  CheckCircle2,
  HeartHandshake,
  Wrench,
  Package,
  AlertTriangle,
  Radio,
  KeyRound,
} from "lucide-react";
import Link from "next/link";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedPortal, setCopiedPortal] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);

  const getAuthHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("eventops_token") : "";
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    // 1. Fetch event metadata
    fetch(`http://localhost:5000/api/v1/events/${eventId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setEvent(data);
        else setEvent(mockEvents.find((e) => e.id === eventId) || mockEvents[0]);
      })
      .catch(() => {
        setEvent(mockEvents.find((e) => e.id === eventId) || mockEvents[0]);
      });

    // 2. Fetch event summary & enrolled members
    fetch(`http://localhost:5000/api/v1/events/${eventId}/summary`, {
      headers: getAuthHeaders(),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSummaryData(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [eventId]);

  const activeEvent = event || mockEvents.find((e) => e.id === eventId) || mockEvents[0];

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const portalUrl = `${origin}/events/${activeEvent.id}/portal`;
  const loginUrl = `${origin}/events/${activeEvent.id}/login`;

  const copyToClipboard = (text: string, type: "portal" | "login") => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      if (type === "portal") {
        setCopiedPortal(true);
        setTimeout(() => setCopiedPortal(false), 2000);
      } else {
        setCopiedLogin(true);
        setTimeout(() => setCopiedLogin(false), 2000);
      }
    }
  };

  const enrolledMembers = summaryData?.enrolledMembers || [];
  const teamsList = summaryData?.teams || [];
  const roleBreakdown = summaryData?.memberCountByRole || {};

  const submodules = [
    { title: "Enrolled Roles & Delegation", desc: "Add Volunteers, Judges, Coordinators & Staff", href: `/events/${activeEvent.id}/roles`, icon: <UserPlus className="w-5 h-5 text-sky-400" /> },
    { title: "Rounds & Timeline", desc: "Progression quotas & schedule", href: `/events/${activeEvent.id}/rounds`, icon: <Layers className="w-5 h-5 text-indigo-400" /> },
    { title: "Time Slots", desc: "Capacity windows & pitch intervals", href: `/events/${activeEvent.id}/timeslots`, icon: <Clock className="w-5 h-5 text-sky-400" /> },
    { title: "Evaluation Criteria", desc: "Dynamic rubrics & scoring weights", href: `/events/${activeEvent.id}/criteria`, icon: <Trophy className="w-5 h-5 text-amber-400" /> },
    { title: "Event Rules & Safety", desc: "Eligibility & code of conduct", href: `/events/${activeEvent.id}/rules`, icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
    { title: "Event Settings", desc: "Metadata, banner & access flags", href: `/events/${activeEvent.id}/settings`, icon: <Settings className="w-5 h-5 text-slate-400" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Event Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-indigo-400 font-bold uppercase">{activeEvent.id}</span>
              <StatusBadge status={activeEvent.status || "LIVE"} />
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {activeEvent.type}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-mono text-white mt-1">{activeEvent.name}</h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">{activeEvent.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/events/${activeEvent.id}/roles`)}
              leftIcon={<UserPlus className="w-3.5 h-3.5 text-sky-400" />}
            >
              Add Staff / Roles
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/control-center")}
            >
              Enter Control Center
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 text-[11px]">Starts</span>
            <p className="font-mono font-medium text-slate-200">{new Date(activeEvent.startDate).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Ends</span>
            <p className="font-mono font-medium text-slate-200">{new Date(activeEvent.endDate).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Registration Deadline</span>
            <p className="font-mono font-medium text-slate-200">{new Date(activeEvent.registrationDeadline).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Current Stage</span>
            <p className="font-mono font-bold text-indigo-400">Round {activeEvent.currentRound || 1} of {activeEvent.totalRounds || 2}</p>
          </div>
        </div>
      </div>

      {/* Shareable Links Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Public Event Portal Link */}
        <div className="p-5 rounded-2xl border border-indigo-500/30 bg-slate-900/90 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold uppercase">
                Public Event Portal
              </span>
              <span className="text-xs text-slate-400">Details & Schedules</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(portalUrl, "portal")}
              leftIcon={copiedPortal ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedPortal ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="font-mono text-xs text-sky-300 select-all truncate bg-slate-950 p-2 rounded-lg border border-slate-800">
            {portalUrl}
          </p>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400">Public link for participants, audiences & press.</p>
            <button
              onClick={() => window.open(portalUrl, "_blank")}
              className="text-xs font-mono text-indigo-400 hover:text-white flex items-center gap-1"
            >
              Open <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 2: Dedicated Role Login Terminal Link */}
        <div className="p-5 rounded-2xl border border-teal-500/30 bg-slate-900/90 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 border border-teal-500/30 text-teal-300 font-bold uppercase">
                Role Login Terminal
              </span>
              <span className="text-xs text-slate-400">Staff Authentication</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(loginUrl, "login")}
              leftIcon={copiedLogin ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedLogin ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="font-mono text-xs text-teal-300 select-all truncate bg-slate-950 p-2 rounded-lg border border-slate-800">
            {loginUrl}
          </p>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400">For Volunteers, Judges, Coordinators & Staff.</p>
            <button
              onClick={() => window.open(loginUrl, "_blank")}
              className="text-xs font-mono text-teal-400 hover:text-white flex items-center gap-1"
            >
              Open <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Event Admin Oversight KPIs */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Event Admin Data Oversight & PostgreSQL Relational Telemetry
            </h3>
            <p className="text-xs text-slate-400">
              Real-time administrative data across enrolled roles, registered teams, attendance logs, and incidents for <strong className="text-slate-200">{activeEvent.name}</strong>.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/events/${activeEvent.id}/roles`)}
            rightIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Manage Delegated Staff
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">ENROLLED STAFF</span>
            <p className="text-xl font-bold font-mono text-sky-400">
              {enrolledMembers.length > 0 ? `${enrolledMembers.length} Members` : "6 Roles"}
            </p>
            <p className="text-[11px] text-slate-400">
              Volunteers, Judges & Tech Staff
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">REGISTERED TEAMS</span>
            <p className="text-xl font-bold font-mono text-white">
              {summaryData?.totalTeams ? `${summaryData.totalTeams} Teams` : "120 Teams"}
            </p>
            <p className="text-[11px] text-slate-400">
              {summaryData?.totalTeams ? `${summaryData.totalTeams * 4} Hackers` : "500+ Participants"}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">ATTENDANCE CHECK-INS</span>
            <p className="text-xl font-bold font-mono text-emerald-400">
              {summaryData?.attendanceScans ? `${summaryData.attendanceScans} Verified` : "114 Verified"}
            </p>
            <p className="text-[11px] text-slate-400">HMAC-SHA256 Token Scans</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">ACTIVE INCIDENTS</span>
            <p className="text-xl font-bold font-mono text-amber-400">
              {summaryData?.incidentCount || 0} Open
            </p>
            <p className="text-[11px] text-slate-400">Telemetry Alert Watch</p>
          </div>
        </div>

        {/* Delegated Roles Breakdown Pills */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 text-[11px] uppercase">Enrolled Staff By Role:</span>
          <span className="px-2.5 py-0.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300">
            Volunteers: {roleBreakdown["VOLUNTEER"] || 0}
          </span>
          <span className="px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300">
            Judges: {roleBreakdown["JUDGE"] || 0}
          </span>
          <span className="px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            Coordinators: {roleBreakdown["COORDINATOR"] || 0}
          </span>
          <span className="px-2.5 py-0.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300">
            Tech Staff: {roleBreakdown["TECHNICAL_STAFF"] || 0}
          </span>
          <span className="px-2.5 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300">
            Resource Mgr: {roleBreakdown["RESOURCE_MANAGER"] || 0}
          </span>
        </div>
      </div>

      {/* Enrolled Roles Table Preview */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Enrolled Roles & Staff Delegation Roster
            </h3>
            <p className="text-xs text-slate-400">
              Personnel delegated and authorized for this event.
            </p>
          </div>
          <Link
            href={`/events/${activeEvent.id}/roles`}
            className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            Manage All Staff <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {enrolledMembers.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <UserPlus className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">No staff members enrolled yet for this event.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/events/${activeEvent.id}/roles`)}
            >
              Add First Volunteer / Judge
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Title / Zone</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {enrolledMembers.slice(0, 5).map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-medium text-white">{m.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {m.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{m.email}</td>
                    <td className="py-2.5 px-3 text-slate-400">{m.title || m.zone_or_dept || "—"}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submodule Jump Cards */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Event Configuration & Rules Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {submodules.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800/80 hover:border-slate-700 transition flex items-start justify-between group cursor-pointer"
            >
              <div className="space-y-1">
                <div className="p-2.5 rounded-xl bg-slate-800 w-fit border border-slate-700/60 mb-2">
                  {mod.icon}
                </div>
                <h4 className="text-sm font-semibold text-slate-100 group-hover:text-white">
                  {mod.title}
                </h4>
                <p className="text-xs text-slate-400">{mod.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
