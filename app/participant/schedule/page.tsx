"use client";

import React from "react";
import { mockEvents } from "@/lib/mock-data/events";
import { StatusBadge } from "@/components/ui/Badge";
import { Calendar, Clock, MapPin, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

export default function ParticipantSchedulePage() {
  const event = mockEvents[0];

  const timeline = [
    {
      time: "08:00 AM - 09:30 AM",
      title: "Check-in & Badge Distribution",
      location: "Main Atrium & Security Desk",
      status: "COMPLETED",
      desc: "Fast QR code scan for digital event pass issuance and breakfast kits.",
    },
    {
      time: "09:30 AM - 10:30 AM",
      title: "Keynote & Problem Statement Briefing",
      location: "Grand Auditorium (Hall Alpha)",
      status: "COMPLETED",
      desc: "Opening remarks, constraint releases, and rules briefing by the Director of Ops.",
    },
    {
      time: "10:30 AM - 01:00 PM",
      title: "Hacking Sprint 1 & Jury Evaluation Round 1",
      location: "Assigned Workstations (Turing Hall)",
      status: "IN_PROGRESS",
      desc: "Architecture validation and CP-SAT assigned judge visits at your desk.",
    },
    {
      time: "01:00 PM - 02:00 PM",
      title: "Networking Lunch & Dietary Counter",
      location: "Dining Hall B",
      status: "UPCOMING",
      desc: "Buffet meal provided upon scanning your Digital EventPass token.",
    },
    {
      time: "02:00 PM - 05:30 PM",
      title: "Hacking Sprint 2 & Prototype Development",
      location: "Assigned Workstations",
      status: "UPCOMING",
      desc: "Technical mentoring sessions and hardware testing lab access.",
    },
    {
      time: "05:30 PM - 07:00 PM",
      title: "Round 2 Evaluation & Top 20 Cutoff",
      location: "Jury Presentation Rooms",
      status: "UPCOMING",
      desc: "5-minute pitch followed by 3-minute jury Q&A.",
    },
    {
      time: "07:30 PM - 08:30 PM",
      title: "Grand Finale & Award Ceremony",
      location: "Grand Auditorium",
      status: "UPCOMING",
      desc: "Top 5 live demos, cash prize distribution, and closing remarks.",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-pink-400 uppercase">Live Timeline</span>
          <StatusBadge status="LIVE" />
        </div>
        <h1 className="text-xl font-bold font-mono text-white mt-1">Official Event Schedule</h1>
        <p className="text-xs text-slate-400">
          All times synchronized with central Operations Control Center
        </p>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-800">
        {timeline.map((item, idx) => {
          const isCurrent = item.status === "IN_PROGRESS";
          const isDone = item.status === "COMPLETED";

          return (
            <div key={idx} className="relative flex items-start gap-6 pl-10">
              {/* Dot */}
              <div
                className={`absolute left-2.5 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all ${
                  isCurrent
                    ? "bg-indigo-500 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse"
                    : isDone
                    ? "bg-emerald-500 border-emerald-400"
                    : "bg-slate-900 border-slate-700"
                }`}
              />

              <div
                className={`w-full p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? "border-indigo-500/40 bg-indigo-950/20 shadow-lg shadow-indigo-500/5"
                    : "border-slate-800 bg-slate-900/80"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">{item.time}</span>
                    <StatusBadge status={item.status as any} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.location}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mt-2">{item.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
