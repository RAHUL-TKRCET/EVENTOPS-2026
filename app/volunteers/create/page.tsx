"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ArrowLeft, Send, ShieldCheck, Mail, Phone, HeartHandshake } from "lucide-react";
import Link from "next/link";

export default function CreateVolunteerPage() {
  const router = useRouter();
  const [name, setName] = useState("Kiran Deshmukh");
  const [email, setEmail] = useState("kiran.d@university.edu");
  const [phone, setPhone] = useState("+1 415-555-0391");
  const [role, setRole] = useState("Floor Marshal (Hall B)");
  const [zone, setZone] = useState("Zone A — Turing Hall");
  const [shift, setShift] = useState("MORNING");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSent(true);
      setTimeout(() => router.push("/volunteers"), 1500);
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/volunteers"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Invite Operations Volunteer</h2>
          <p className="text-xs text-slate-400">
            Dispatch official volunteer invitation with zone assignment and shift schedule.
          </p>
        </div>
      </div>

      {sent && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 flex items-center gap-2">
          <Send className="w-4 h-4 text-teal-400" />
          <span>Volunteer invitation dispatched to {email}. Scoped VOLUNTEER credentials provisioned.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        {/* Role Assignment Notice */}
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HeartHandshake className="w-5 h-5 text-teal-400" />
            <div>
              <span className="text-xs font-bold text-white block">Assigned Role: VOLUNTEER</span>
              <span className="text-[11px] text-slate-300">
                Authorized for check-in QR scanner, task completion, and incident reporting.
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase bg-teal-500/20 text-teal-300 px-2.5 py-1 rounded-full font-bold border border-teal-500/40">
            ROLE = VOLUNTEER
          </span>
        </div>

        <Input label="Full Legal / Professional Name" required value={name} onChange={(e) => setName(e.target.value)} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
          />
          <Input
            label="Mobile Phone"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4 text-slate-500" />}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Operational Role / Responsibility"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Floor Marshal, Check-In Lead"
          />
          <Input
            label="Assigned Physical Zone"
            required
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="e.g. Zone A (Turing Hall)"
          />
        </div>

        <Select
          label="Shift Assignment"
          value={shift}
          onChange={(e) => setShift(e.target.value)}
          options={[
            { value: "MORNING", label: "Morning Shift (08:00 AM - 02:00 PM)" },
            { value: "AFTERNOON", label: "Afternoon Shift (02:00 PM - 08:00 PM)" },
            { value: "NIGHT", label: "Overnight Hack Sprint (08:00 PM - 08:00 AM)" },
          ]}
        />

        <div className="pt-4 flex justify-between border-t border-slate-800">
          <Button type="button" variant="outline" onClick={() => router.push("/volunteers")}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSending}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Send Volunteer Invitation
          </Button>
        </div>
      </form>
    </div>
  );
}
