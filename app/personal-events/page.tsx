"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Plus,
  ArrowRight,
  ArrowLeft,
  Users,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  Search,
  Building2,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PersonalEventsPage() {
  const router = useRouter();
  const { personalEvents, selectPersonalEventWorkspace, currentUser, logout } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = (personalEvents || []).filter((evt) =>
    evt?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    evt?.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenEvent = (eventId: string) => {
    selectPersonalEventWorkspace(eventId);
    router.push(`/events/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/workspace" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-mono">
            <ArrowLeft className="w-4 h-4" />
            <span>Workspace Hub</span>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <span className="font-extrabold text-sm font-mono tracking-wider">EVENTOPS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/workspace"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs text-indigo-400 font-mono transition"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Organizations</span>
          </Link>

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
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8 flex-1">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>INDEPENDENT WORKSPACE</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Personal Events</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Run standalone workshops, hackathons, and meetups without creating or joining an organization.
            </p>
          </div>

          <Link
            href="/personal-events/create"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Personal Event</span>
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search personal events by name or format..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600"
            />
          </div>

          <span className="text-xs font-mono text-slate-500 hidden sm:inline">
            Showing {filteredEvents.length} event{filteredEvents.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 transition-all flex flex-col justify-between group"
            >
              {evt.bannerUrl && (
                <div className="h-36 w-full relative overflow-hidden bg-slate-950">
                  <img
                    src={evt.bannerUrl}
                    alt={evt.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-slate-950 shadow-md">
                      Personal Event
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                      {evt.status}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
                    <span>{evt.type}</span>
                    <span>•</span>
                    <span className="text-slate-400">
                      {new Date(evt.startDate).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    {evt.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{evt.registeredTeamsCount || 0} / {evt.expectedParticipants} Participants</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{evt.location || "Online"}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEvent(evt.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 hover:border-transparent text-xs font-bold transition cursor-pointer"
                  >
                    <span>Open Event Management</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-4">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No personal events found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't created any personal events yet. Create one now to start tracking attendees and schedules without an organization.
            </p>
            <Link
              href="/personal-events/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Personal Event</span>
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        EVENTOPS Personal Events Hub • Standalone Event Operations
      </footer>
    </div>
  );
}
