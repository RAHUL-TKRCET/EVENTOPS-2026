"use client";

import React from "react";
import { ArrowLeft, Clock, Users, MapPin, CheckCircle } from "lucide-react";
import Link from "next/link";

const shifts = [
  { id: "s1", name: "Shift A: Early Ingress & Badge Handout", hours: "07:30 AM - 01:30 PM", volunteers: 12, zone: "Registration Atrium" },
  { id: "s2", name: "Shift B: Round 1 Floor Marshalling", hours: "01:00 PM - 07:00 PM", volunteers: 16, zone: "All 24 Suites" },
  { id: "s3", name: "Shift C: Midnight Code Sprint Escorts", hours: "07:00 PM - 01:00 AM", volunteers: 7, zone: "Hardware Vault & Benches" },
];

export default function VolunteerShiftsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/volunteers"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Volunteer Shift Calendar</h2>
          <p className="text-xs text-slate-400">Time-slotted coverage for safety, escorts, and turnstiles.</p>
        </div>
      </div>

      <div className="space-y-4">
        {shifts.map((shift) => (
          <div key={shift.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-slate-100">{shift.name}</h3>
              </div>
              <p className="text-slate-400 font-mono text-[11px]">{shift.hours} • Zone: {shift.zone}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono px-3 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700">
                {shift.volunteers} Volunteers Assigned
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
