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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
    setIsLoading(false);
    router.push(`/events/${newEvent.id}`);
  };

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
