"use client";

import React from "react";
import { useAppStore } from "@/store";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  Plus,
  KeyRound,
  ArrowRight,
  Sparkles,
  Users,
  Shield,
  Layers,
  CheckCircle2,
  Compass,
  LogOut,
} from "lucide-react";
import Link from "next/link";

export default function WorkspaceSelectionPage() {
  const router = useRouter();
  const {
    currentUser,
    userOrganizations,
    personalEvents,
    selectOrganizationWorkspace,
    selectPersonalEventWorkspace,
    logout,
  } = useAppStore();

  const handleOpenOrg = (orgId: string) => {
    selectOrganizationWorkspace(orgId);
    router.push("/dashboard");
  };

  const handleOpenPersonalEvent = (eventId: string) => {
    selectPersonalEventWorkspace(eventId);
    router.push(`/events/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-wider text-white font-mono">
              EVENTOPS
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] text-slate-400 font-mono tracking-tight">
              RUN THE EVENT, NOT THE PAPERWORK.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{currentUser.name}</span>
            <span className="text-[10px] text-indigo-400 font-mono">({currentUser.role})</span>
          </div>

          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:text-rose-400 text-xs text-slate-400 transition cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 space-y-10 flex-1">
        {/* Welcome Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>WORKSPACE SELECTOR</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            What would you like to manage today? Choose an organization workspace or run your independent personal events without paperwork.
          </p>
        </div>

        {/* Two Top-Level Mode Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Organization Mode */}
          <div className="relative group rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-7 shadow-xl hover:border-indigo-500/60 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
                  Multi-Tenant RBAC
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Organization Mode</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Manage operations for institutions, businesses, colleges, or communities. Run multiple concurrent events with role-based coordination.
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs text-slate-300 font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>College, University, School & Training Institutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Enterprises, Startups, Event Agencies & NGOs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Judge allocations, scanner desks, volunteer rosters</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/organizations/create"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Organization</span>
              </Link>
              <Link
                href="/organizations/join"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Join with Code</span>
              </Link>
            </div>
          </div>

          {/* Pillar 2: Personal Event Mode */}
          <div className="relative group rounded-2xl border border-amber-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-7 shadow-xl hover:border-amber-500/60 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold">
                  Zero Overhead
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Personal Event Mode</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Run standalone workshops, hackathons, seminars, or community meetups without needing to create or join an organization.
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs text-slate-300 font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>No organization requirement or tenant paperwork</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Full access to attendance, teams, and live judging</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Marked clearly as Personal Event workspace</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/personal-events/create"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-lg shadow-amber-500/25 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Personal Event</span>
              </Link>
              <Link
                href="/personal-events"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-medium transition cursor-pointer"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>View Personal Events</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Existing Organizations Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <span>Your Organizations</span>
              </h2>
              <p className="text-xs text-slate-400">Organizations where you have an active administrative or staff membership.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/organizations/create"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Org</span>
              </Link>
              <span className="text-slate-600">•</span>
              <Link
                href="/organizations/join"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Join Org</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(userOrganizations || []).map((org) => (
              <div
                key={org.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
                      {org.type} {org.subtype ? `• ${org.subtype}` : ""}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {org.city || org.country || "Global"}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {org.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {org.description || "Enterprise event operations workspace."}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      {org.membersCount || 24} members
                    </span>
                    <span>•</span>
                    <span>{org.activeEventsCount || 1} events</span>
                  </div>

                  <button
                    onClick={() => handleOpenOrg(org.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-transparent text-xs font-medium transition cursor-pointer"
                  >
                    <span>Open Organization</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Existing Personal Events Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>Personal Events</span>
              </h2>
              <p className="text-xs text-slate-400">Independent events created and managed directly by you.</p>
            </div>
            <Link
              href="/personal-events/create"
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Personal Event</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(personalEvents || []).map((evt) => (
              <div
                key={evt.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold">
                      Personal Event
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(evt.startDate).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {evt.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {evt.registeredTeamsCount || 0} Participants
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{evt.status}</span>
                  </div>

                  <button
                    onClick={() => handleOpenPersonalEvent(evt.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 hover:border-transparent text-xs font-semibold transition cursor-pointer"
                  >
                    <span>Open Event</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 px-6 text-center text-xs text-slate-500 font-mono">
        EVENTOPS Universal SaaS Platform • Team Panch Pandavs • RUN THE EVENT, NOT THE PAPERWORK.
      </footer>
    </div>
  );
}
