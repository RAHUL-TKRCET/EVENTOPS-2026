"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const event = mockEvents.find((e) => e.id === eventId) || mockEvents[0];
  const [copiedLink, setCopiedLink] = useState(false);

  const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/events/${event.id}/portal` : `/events/${event.id}/portal`;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(portalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const submodules = [
    { title: "Enrolled Roles & Delegation", desc: "Add Volunteers, Judges, Coordinators & Staff", href: `/events/${event.id}/roles`, icon: <UserPlus className="w-5 h-5 text-sky-400" /> },
    { title: "Rounds & Timeline", desc: "Progression quotas & schedule", href: `/events/${event.id}/rounds`, icon: <Layers className="w-5 h-5 text-indigo-400" /> },
    { title: "Time Slots", desc: "Capacity windows & pitch intervals", href: `/events/${event.id}/timeslots`, icon: <Clock className="w-5 h-5 text-sky-400" /> },
    { title: "Evaluation Criteria", desc: "Dynamic rubrics & scoring weights", href: `/events/${event.id}/criteria`, icon: <Trophy className="w-5 h-5 text-amber-400" /> },
    { title: "Event Rules & Safety", desc: "Eligibility & code of conduct", href: `/events/${event.id}/rules`, icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
    { title: "Event Settings", desc: "Metadata, banner & access flags", href: `/events/${event.id}/settings`, icon: <Settings className="w-5 h-5 text-slate-400" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Event Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-indigo-400 font-bold uppercase">{event.id}</span>
              <StatusBadge status={event.status} />
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {event.type}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-mono text-white mt-1">{event.name}</h2>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">{event.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/allocation/optimization")}
            >
              Run Allocation
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
            <p className="font-mono font-medium text-slate-200">{new Date(event.startDate).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Ends</span>
            <p className="font-mono font-medium text-slate-200">{new Date(event.endDate).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Registration Deadline</span>
            <p className="font-mono font-medium text-slate-200">{new Date(event.registrationDeadline).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[11px]">Current Stage</span>
            <p className="font-mono font-bold text-indigo-400">Round {event.currentRound} of {event.totalRounds}</p>
          </div>
        </div>
      </div>

      {/* Shareable Public Event Portal & Dedicated Role Login Link Banner */}
      <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold uppercase">
              Event Portal & Role Login Link
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Share with Participants, Judges, Volunteers & Staff</span>
          </div>
          <p className="font-mono text-xs text-sky-300 select-all font-semibold">
            {portalUrl}
          </p>
          <p className="text-[11px] text-slate-400">
            Dedicated portal displaying event rules, schedule, and role-specific login terminals for this event.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            leftIcon={copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copiedLink ? "Link Copied!" : "Copy Portal Link"}
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => window.open(portalUrl, "_blank")}
            rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            Open Role Login
          </Button>
        </div>
      </div>

      {/* Event Admin Oversight Data Cards */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Event Admin Data Oversight & Enrolled Roles
            </h3>
            <p className="text-xs text-slate-400">
              Complete administrative access across all registered teams, juries, volunteers, and operational telemetry.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/events/${event.id}/roles`)}
            rightIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Manage Delegated Staff
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">REGISTERED TEAMS</span>
            <p className="text-xl font-bold font-mono text-white">120 Teams</p>
            <p className="text-[11px] text-slate-400">500+ Enrolled Participants</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">DELEGATED STAFF</span>
            <p className="text-xl font-bold font-mono text-sky-400">Volunteers & Judges</p>
            <p className="text-[11px] text-slate-400">Active Roles in PostgreSQL</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">ATTENDANCE CHECK-INS</span>
            <p className="text-xl font-bold font-mono text-emerald-400">114 Verified</p>
            <p className="text-[11px] text-slate-400">HMAC-SHA256 Token Scans</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">ALLOCATION STATUS</span>
            <p className="text-xl font-bold font-mono text-amber-400">CP-SAT Optimized</p>
            <p className="text-[11px] text-slate-400">12 Venues & Benches Assigned</p>
          </div>
        </div>
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
