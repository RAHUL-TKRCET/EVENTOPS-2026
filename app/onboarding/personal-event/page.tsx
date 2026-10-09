"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Input";
import { eventsApi } from "@/lib/api/events";
import { useAppStore } from "@/store";
import { Sparkles, Calendar, ArrowRight } from "lucide-react";
import { EventType } from "@/types";

export default function PersonalEventOnboardingPage() {
  const router = useRouter();
  const { setCurrentEvent } = useAppStore();
  const [name, setName] = useState("AI Builders Weekend Meetup");
  const [type, setType] = useState<EventType>("Meetup");
  const [description, setDescription] = useState("Community sprint focused on open-source autonomous agents and fine-tuning.");
  const [expectedParticipants, setExpectedParticipants] = useState("60");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const newEvt = await eventsApi.create({
      name,
      type,
      description,
      expectedParticipants: parseInt(expectedParticipants, 10) || 60,
    });
    setCurrentEvent(newEvt);
    setIsLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="max-w-xl mx-auto p-6 md:p-8 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white font-mono">Create Personal / Independent Event</h2>
          <p className="text-xs text-slate-400">
            For solo creators, hack nights, regional meetups, or community symposiums.
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <Input
          label="Event Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Event Type"
            value={type}
            onChange={(e) => setType(e.target.value as EventType)}
            options={[
              { value: "Meetup", label: "Meetup / Hack Night" },
              { value: "Workshop", label: "Hands-on Workshop" },
              { value: "Competition", label: "Developer Competition" },
              { value: "Conference", label: "Community Conference" },
              { value: "Hackathon", label: "Independent Hackathon" },
            ]}
          />

          <Input
            label="Expected Participants"
            type="number"
            value={expectedParticipants}
            onChange={(e) => setExpectedParticipants(e.target.value)}
          />
        </div>

        <Textarea
          label="Brief Objective & Logistics"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="pt-4 flex items-center justify-end border-t border-slate-800">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Launch Personal Event Dashboard
          </Button>
        </div>
      </form>
    </div>
  );
}
