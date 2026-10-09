"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { eventsApi } from "@/lib/api/events";
import { useAppStore } from "@/store";
import { Calendar, ArrowRight, Layers, Clock, ShieldCheck, Check } from "lucide-react";
import { EventType } from "@/types";

const eventTypes: { value: EventType; label: string }[] = [
  { value: "Hackathon", label: "Hackathon (Flagship Demo)" },
  { value: "College Fest", label: "College Fest / Cultural Summit" },
  { value: "Technical Symposium", label: "Technical Symposium" },
  { value: "Conference", label: "Corporate / Industry Conference" },
  { value: "Workshop", label: "Hands-on Technical Workshop" },
  { value: "Seminar", label: "Academic / Research Seminar" },
  { value: "Competition", label: "Competitive Coding / Robotics" },
  { value: "Sports Event", label: "Sports Championship" },
  { value: "Cultural Event", label: "Arts & Cultural Fest" },
  { value: "Job Fair", label: "Recruitment / Job Fair" },
  { value: "Career Fair", label: "University Career Fair" },
  { value: "Exhibition", label: "Product Showcase / Expo" },
  { value: "Meetup", label: "Developer Meetup" },
  { value: "Festival", label: "Community Festival" },
  { value: "Corporate Event", label: "Enterprise Summit" },
  { value: "Training Program", label: "Professional Training Program" },
  { value: "Custom Event", label: "Custom Domain Event" },
];

export default function CreateEventPage() {
  const router = useRouter();
  const { setCurrentEvent } = useAppStore();

  const [name, setName] = useState("VISTRA AI Innovation Challenge 2026");
  const [type, setType] = useState<EventType>("Hackathon");
  const [description, setDescription] = useState(
    "36-Hour continuous deep-tech hackathon with AI requirement matching and CP-SAT judge allocation."
  );
  const [startDate, setStartDate] = useState("2026-10-15T08:00");
  const [endDate, setEndDate] = useState("2026-10-17T20:00");
  const [registrationDeadline, setRegistrationDeadline] = useState("2026-10-10T23:59");
  const [expectedParticipants, setExpectedParticipants] = useState("500");
  const [totalRounds, setTotalRounds] = useState("3");
  const [isLoading, setIsLoading] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<any | null>(null);
  const [copiedPortal, setCopiedPortal] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newEvent = await eventsApi.create({
        name,
        type,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        registrationDeadline: new Date(registrationDeadline).toISOString(),
        expectedParticipants: parseInt(expectedParticipants, 10) || 500,
        totalRounds: parseInt(totalRounds, 10) || 3,
      });

      setCurrentEvent(newEvent);
      setCreatedEvent(newEvent);
    } catch (err: any) {
      alert("Failed to create event: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const portalUrl = createdEvent ? `${origin}/events/${createdEvent.id}/portal` : "";
  const loginUrl = createdEvent ? `${origin}/events/${createdEvent.id}/login` : "";

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

  if (createdEvent) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div className="space-y-1">
            <span className="font-mono text-xs uppercase px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
              EVENT CREATED & REGISTERED IN POSTGRESQL
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-white mt-2">
              {createdEvent.name}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Event ID: <strong className="text-indigo-400">{createdEvent.id}</strong> • Type: {createdEvent.type}
            </p>
          </div>

          <p className="text-xs text-slate-300 max-w-xl mx-auto">
            Your event is now live! Below are the public links to share with participants and delegates, and the role login terminal for your event staff.
          </p>

          <div className="space-y-3 pt-4 text-left">
            {/* Link 1: Event Details & Portal Link */}
            <div className="p-4 rounded-2xl border border-indigo-500/30 bg-slate-900/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-indigo-300 uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> 1. Public Event Details & Portal
                </span>
                <button
                  onClick={() => copyToClipboard(portalUrl, "portal")}
                  className="text-xs text-indigo-400 hover:text-white transition flex items-center gap-1 font-mono font-medium"
                >
                  {copiedPortal ? "✓ Copied!" : "Copy Link"}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-sky-300 select-all break-all">
                {portalUrl}
              </div>
              <p className="text-[11px] text-slate-400">
                Share with attendees to view event abstract, guidelines, schedules, and rounds overview.
              </p>
            </div>

            {/* Link 2: Role-Specific Login Terminal Link */}
            <div className="p-4 rounded-2xl border border-teal-500/30 bg-slate-900/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-teal-300 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> 2. Role-Specific Login Terminal
                </span>
                <button
                  onClick={() => copyToClipboard(loginUrl, "login")}
                  className="text-xs text-teal-400 hover:text-white transition flex items-center gap-1 font-mono font-medium"
                >
                  {copiedLogin ? "✓ Copied!" : "Copy Link"}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-teal-300 select-all break-all">
                {loginUrl}
              </div>
              <p className="text-[11px] text-slate-400">
                Dedicated terminal for enrolled Volunteers, Judges, Coordinators, Technical Staff, and Resource Managers.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-slate-800/80">
            <Button
              variant="outline"
              size="md"
              onClick={() => router.push(`/events/${createdEvent.id}/roles`)}
            >
              Delegate Roles & Staff (Add Volunteers/Judges)
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push(`/events/${createdEvent.id}`)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Event Command Hub
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white font-mono">Create Enterprise Event</h2>
          <p className="text-xs text-slate-400">
            Configure round progression, rubrics, venues, time slots, and compliance rules.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>1. Core Event Metadata</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Event Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Select
              label="Event Type (Universal SaaS)"
              value={type}
              onChange={(e) => setType(e.target.value as EventType)}
              options={eventTypes}
            />

            <Input
              label="Start Date & Time"
              type="datetime-local"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="End Date & Time"
              type="datetime-local"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <Input
              label="Registration Deadline"
              type="datetime-local"
              required
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Target Participants"
                type="number"
                value={expectedParticipants}
                onChange={(e) => setExpectedParticipants(e.target.value)}
              />
              <Input
                label="Total Rounds"
                type="number"
                value={totalRounds}
                onChange={(e) => setTotalRounds(e.target.value)}
              />
            </div>
          </div>

          <Textarea
            label="Event Abstract & Rules Overview"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Preset Operational Rules & Rubrics Preview */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>2. Built-in Operations Framework</span>
          </h3>
          <p className="text-xs text-slate-400">
            EventOps pre-provisions standard round evaluation criteria, time slot matrix, and hardware rules. You can fine-tune them anytime inside Event Hub.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs space-y-1">
              <span className="font-semibold text-indigo-400">3 Default Rounds</span>
              <p className="text-slate-400 text-[11px]">Screening → Prototype Demo → Jury Grand Finale</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs space-y-1">
              <span className="font-semibold text-emerald-400">Weighted Rubrics</span>
              <p className="text-slate-400 text-[11px]">Feasibility, Novelty, Completeness, Domain Impact</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs space-y-1">
              <span className="font-semibold text-amber-400">Automated OR-Tools</span>
              <p className="text-slate-400 text-[11px]">Sub-second bench & evaluator optimization ready</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/events")}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Event & Initialize Modules
          </Button>
        </div>
      </form>
    </div>
  );
}
