"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, ArrowRight, Layers } from "lucide-react";
import Link from "next/link";

export default function CreateRoundPage() {
  const router = useRouter();
  const [name, setName] = useState("Round 4 — Lightning Pitches & VC Showcase");
  const [quota, setQuota] = useState("5");
  const [startTime, setStartTime] = useState("2026-10-17T18:00");
  const [endTime, setEndTime] = useState("2026-10-17T20:00");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/rounds");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/rounds"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Create Custom Round</h2>
          <p className="text-xs text-slate-400">Append an additional evaluation or knockout stage.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <Input label="Round Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Qualifying Quota (Teams to Advance)" type="number" required value={quota} onChange={(e) => setQuota(e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Time" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input label="End Time" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>

        <div className="pt-4 flex justify-between border-t border-slate-800">
          <Button type="button" variant="outline" onClick={() => router.push("/rounds")}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Round
          </Button>
        </div>
      </form>
    </div>
  );
}
