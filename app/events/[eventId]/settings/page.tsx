"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockEvents } from "@/lib/mock-data/events";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EventSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const event = mockEvents.find((e) => e.id === eventId) || mockEvents[0];

  const [name, setName] = useState(event?.name || "");
  const [desc, setDesc] = useState(event?.description || "");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={event ? `/events/${event.id}` : "/events"}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Event Operational Settings</h2>
          <p className="text-xs text-slate-400">Manage lifecycle status, branding, and permissions.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <Input label="Event Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea label="Event Description" value={desc} onChange={(e) => setDesc(e.target.value)} />

        <div className="pt-4 flex items-center justify-between border-t border-slate-800">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4" /> Settings updated
            </span>
          )}
          <Button type="submit" variant="primary" size="md" className="ml-auto">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
