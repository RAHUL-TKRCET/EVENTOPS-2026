"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  MapPin,
  Users,
  Image as ImageIcon,
  Clock,
  Layers,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { EventType } from "@/types";

const EVENT_TYPE_OPTIONS: EventType[] = [
  "Workshop",
  "Meetup",
  "Hackathon",
  "Conference",
  "Seminar",
  "Community Event",
  "Corporate Event",
  "Custom Event",
];

const PRESET_BANNERS = [
  {
    label: "Tech / Workshop",
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80",
  },
  {
    label: "Networking Meetup",
    url: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80",
  },
  {
    label: "Hackathon / Code",
    url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
  },
  {
    label: "Keynote / Stage",
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
  },
];

export default function CreatePersonalEventPage() {
  const router = useRouter();
  const { createPersonalEvent, currentUser } = useAppStore();

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: EventType;
    startDate: string;
    endDate: string;
    location: string;
    expectedParticipants: number;
    bannerUrl: string;
  }>({
    name: "",
    description: "",
    type: "Workshop",
    startDate: "2026-10-25T10:00",
    endDate: "2026-10-25T17:00",
    location: "Studio Hall 4 & Virtual Stream",
    expectedParticipants: 60,
    bannerUrl: PRESET_BANNERS[0].url,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newEvent = createPersonalEvent({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        location: formData.location,
        expectedParticipants: Number(formData.expectedParticipants) || 50,
        bannerUrl: formData.bannerUrl,
      });

      setCreatedSuccess(true);
      setTimeout(() => {
        router.push(`/events/${newEvent.id}`);
      }, 1000);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 right-1/4 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/personal-events" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-mono">
            <ArrowLeft className="w-4 h-4" />
            <span>Personal Events</span>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <span className="font-extrabold text-sm font-mono tracking-wider">EVENTOPS</span>
          </div>
        </div>

        <div className="text-xs font-mono text-amber-400 font-semibold px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20">
          Personal Event Mode
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 flex-1">
        {createdSuccess ? (
          <div className="text-center p-12 rounded-2xl border border-amber-500/40 bg-slate-900/90 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Personal Event Created!</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Opening your event management interface with Personal Event context enabled...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>INDEPENDENT EVENT WIZARD</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Personal Event</h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Launch a standalone event without joining or establishing an organization. You have immediate access to attendee QR passes, team rosters, and round schedules.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl space-y-6">
              {/* Event Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js 16 Full-Stack Masterclass or Weekend Indie Hackathon"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600"
                />
              </div>

              {/* Event Type & Expected Participants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Event Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition cursor-pointer"
                  >
                    {EVENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Expected Participants</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    value={formData.expectedParticipants}
                    onChange={(e) => setFormData({ ...formData, expectedParticipants: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Event Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline the agenda, prerequisites, deliverables, and format..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition placeholder:text-slate-600 resize-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Start Date & Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>End Date & Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Event Location / Streaming Link</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Innovate Hall, Sector 4 or Google Meet link"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Event Image Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Event Cover Banner</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_BANNERS.map((preset) => {
                    const isSelected = formData.bannerUrl === preset.url;
                    return (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setFormData({ ...formData, bannerUrl: preset.url })}
                        className={`group relative rounded-xl overflow-hidden border transition cursor-pointer text-left ${
                          isSelected
                            ? "border-amber-500 ring-2 ring-amber-500/30"
                            : "border-slate-800 hover:border-slate-700 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-16 object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1 text-center">
                          <span className="text-[10px] text-white font-mono font-medium">{preset.label}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Callout Notice */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Independent Workspace: </span>
                  This event will be created directly under your personal account (<span className="text-white font-mono">{currentUser?.email || "personal account"}</span>) without an organization affiliation. You can invite participants, score submissions, and scan attendee QR codes.
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href="/personal-events"
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  <span>{isSubmitting ? "Configuring Event..." : "Create Event"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        EVENTOPS Personal Event Mode • Zero Setup Overhead
      </footer>
    </div>
  );
}
