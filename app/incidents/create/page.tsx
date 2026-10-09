"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { incidentsApi } from "@/lib/api/incidents";
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { IncidentPriority } from "@/types";

export default function CreateIncidentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Unstable WiFi connection on Bench Row 12");
  const [category, setCategory] = useState("NETWORK");
  const [priority, setPriority] = useState<IncidentPriority>("HIGH");
  const [location, setLocation] = useState("Room 201 - Von Neumann Hall");
  const [description, setDescription] = useState("Teams T012 and T014 experiencing intermittent DNS timeout when cloning git submodules.");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const created = await incidentsApi.create({
      title,
      category: category as any,
      priority,
      location,
      description,
    });

    setIsLoading(false);
    router.push(`/incidents/${created.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/incidents"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Log Operational Incident</h2>
          <p className="text-xs text-slate-400">Escalate hardware, power, connectivity, or disputes.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <Input label="Incident Title" required value={title} onChange={(e) => setTitle(e.target.value)} />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: "NETWORK", label: "Network & Connectivity" },
              { value: "POWER", label: "Electrical & Breaker Trip" },
              { value: "HARDWARE", label: "Hardware Kit Defect" },
              { value: "MEDICAL", label: "Medical / First Aid" },
              { value: "DISPUTE", label: "Participant / Jury Dispute" },
              { value: "FACILITY", label: "Facility & Restrooms" },
              { value: "OTHER", label: "Other Operational Issue" },
            ]}
          />

          <Select
            label="Severity Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as IncidentPriority)}
            options={[
              { value: "CRITICAL", label: "Critical (Immediate Escalation)" },
              { value: "HIGH", label: "High Priority" },
              { value: "MEDIUM", label: "Medium Priority" },
              { value: "LOW", label: "Low Priority" },
            ]}
          />
        </div>

        <Input label="Physical Location" required value={location} onChange={(e) => setLocation(e.target.value)} />
        <Textarea label="Incident Details & Symptoms" required value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="pt-4 flex justify-between border-t border-slate-800">
          <Button type="button" variant="outline" onClick={() => router.push("/incidents")}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Submit & Page Response Team
          </Button>
        </div>
      </form>
    </div>
  );
}
