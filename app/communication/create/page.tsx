"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ArrowLeft, ArrowRight, Send, Check } from "lucide-react";
import Link from "next/link";

export default function CreateBroadcastPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Round 2 Demo Schedule Announcement");
  const [audience, setAudience] = useState("ALL");
  const [message, setMessage] = useState("Round 1 evaluation is concluding. Qualified teams for Round 2 will receive bench migration instructions in 15 minutes.");
  const [channels, setChannels] = useState({ inApp: true, email: true, sms: false, whatsapp: false });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/communication");
    }, 400);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/communication"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Compose Multi-Channel Broadcast</h2>
          <p className="text-xs text-slate-400">Dispatch immediate notifications to teams, judges, or field volunteers.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <Input label="Broadcast Headline" required value={title} onChange={(e) => setTitle(e.target.value)} />

        <Select
          label="Target Audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          options={[
            { value: "ALL", label: "Everyone (All Participants, Judges & Staff)" },
            { value: "PARTICIPANTS", label: "Team Participants Only" },
            { value: "JUDGES", label: "Jury Evaluators Only" },
            { value: "VOLUNTEERS", label: "Volunteers & Floor Marshals" },
            { value: "COORDINATORS", label: "Event Coordinators & Track Leads" },
            { value: "TECHNICAL_STAFF", label: "Technical & Power Infra Staff" },
            { value: "RESOURCE_MANAGERS", label: "Food & Resource Managers" },
          ]}
        />

        <Textarea label="Broadcast Message Body" required value={message} onChange={(e) => setMessage(e.target.value)} />

        <div className="pt-2">
          <label className="block text-xs font-medium text-slate-300 mb-2">Delivery Channels</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 cursor-pointer">
              <input type="checkbox" checked={channels.inApp} onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })} />
              <span>In-App Banner</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 cursor-pointer">
              <input type="checkbox" checked={channels.email} onChange={(e) => setChannels({ ...channels, email: e.target.checked })} />
              <span>Email Digest</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 cursor-pointer">
              <input type="checkbox" checked={channels.sms} onChange={(e) => setChannels({ ...channels, sms: e.target.checked })} />
              <span>Urgent SMS</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 cursor-pointer">
              <input type="checkbox" checked={channels.whatsapp} onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })} />
              <span>WhatsApp API</span>
            </label>
          </div>
        </div>

        <div className="pt-4 flex justify-between border-t border-slate-800">
          <Button type="button" variant="outline" onClick={() => router.push("/communication")}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} rightIcon={<Send className="w-4 h-4" />}>
            Broadcast Announcement
          </Button>
        </div>
      </form>
    </div>
  );
}
