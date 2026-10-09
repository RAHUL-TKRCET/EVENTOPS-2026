"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { judgesApi } from "@/lib/api/judges";
import { mockEvents } from "@/lib/mock-data/events";
import { Scale, ArrowLeft, ArrowRight, Mail, Phone, ShieldCheck, Send } from "lucide-react";
import Link from "next/link";

export default function CreateJudgePage() {
  const router = useRouter();
  const [name, setName] = useState("Dr. Marcus Vance");
  const [email, setEmail] = useState("marcus.vance@mit.edu");
  const [phone, setPhone] = useState("+1 617-555-0142");
  const [organization, setOrganization] = useState("MIT CSAIL");
  const [designation, setDesignation] = useState("Professor of Computer Science & AI");
  const [expertise, setExpertise] = useState("AI / Machine Learning, Distributed Systems, Computer Vision");
  const [domains, setDomains] = useState("AI / Machine Learning, HealthTech");
  const [capacity, setCapacity] = useState("8");
  const [availability, setAvailability] = useState<"FULL_TIME" | "PART_TIME">("FULL_TIME");
  const [assignedEvent, setAssignedEvent] = useState(mockEvents[0]?.id || "evt-01");
  const [conflicts, setConflicts] = useState("Cannot evaluate Team T003: Alumni affiliation");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const newJudge = await judgesApi.create({
      name,
      organization,
      designation,
      expertise: expertise.split(",").map((s) => s.trim()),
      domains: domains.split(",").map((s) => s.trim()),
      maxTeamCapacity: parseInt(capacity, 10) || 8,
      availability,
      conflicts: conflicts ? [conflicts] : [],
    });

    setIsLoading(false);
    setInviteSent(true);
    setTimeout(() => {
      router.push(`/judges/${newJudge.id}`);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/judges"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Invite & Assign Judge</h2>
          <p className="text-xs text-slate-400">
            Invite domain evaluators, assign event, and provision scoped JUDGE role access.
          </p>
        </div>
      </div>

      {inviteSent && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-3">
          <Send className="w-4 h-4 text-emerald-400" />
          <span>Official Judge Invitation successfully dispatched to {email}. Scoped portal initialized.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-5">
        {/* Role & Event Assignment Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-white block">Assigned Role: JUDGE</span>
              <span className="text-[11px] text-slate-300">
                Authorized for assigned evaluation rubrics and verification QR scan only.
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-bold border border-amber-500/40">
            ROLE = JUDGE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name & Academic Title" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Evaluator Corporate / Academic Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
          />
          <Input
            label="Mobile Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4 text-slate-500" />}
          />
          <Input label="Affiliated University or Firm" required value={organization} onChange={(e) => setOrganization(e.target.value)} />
          <Input label="Professional Designation" required value={designation} onChange={(e) => setDesignation(e.target.value)} />

          <Select
            label="Assign Event"
            value={assignedEvent}
            onChange={(e) => setAssignedEvent(e.target.value)}
            options={mockEvents.map((evt) => ({ value: evt.id, label: evt.name }))}
          />

          <Input label="Domain Expertise" value={expertise} onChange={(e) => setExpertise(e.target.value)} hint="Comma-separated" />
          <Input label="Evaluator Domains" value={domains} onChange={(e) => setDomains(e.target.value)} hint="Match against team tracks" />
          <Input label="Max Team Capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          <Select
            label="Availability Commitment"
            value={availability}
            onChange={(e) => setAvailability(e.target.value as any)}
            options={[
              { value: "FULL_TIME", label: "Full-Time (All Rounds & Finals)" },
              { value: "PART_TIME", label: "Part-Time (Designated Slots Only)" },
            ]}
          />
        </div>

        <div className="pt-2 border-t border-slate-800">
          <Input
            label="Declared Conflicts of Interest"
            value={conflicts}
            onChange={(e) => setConflicts(e.target.value)}
            hint="OR-Tools solver mathematically prohibits assigning teams declared here."
          />
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-800">
          <Button type="button" variant="outline" onClick={() => router.push("/judges")}>
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Send Judge Invitation
          </Button>
        </div>
      </form>
    </div>
  );
}
