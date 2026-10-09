"use client";

import React, { useState } from "react";
import { Megaphone, Bell, Clock, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";

export default function ParticipantAnnouncementsPage() {
  const announcements = [
    {
      id: "ann-01",
      title: "Round 1 Code Freeze & Pitch Preparation",
      time: "11:15 AM",
      category: "OPERATIONS",
      message:
        "All teams participating in Round 1 must commit and push their final repository changes. Judges are beginning their floor rounds.",
      isImportant: true,
    },
    {
      id: "ann-02",
      title: "Catering & Lunch Counter Opening",
      time: "10:45 AM",
      category: "LOGISTICS",
      message:
        "Lunch counters in Dining Hall B will open at 12:30 PM. Please present your Digital EventPass QR token at the check-in point.",
      isImportant: false,
    },
    {
      id: "ann-03",
      title: "Hardware Lab & Component Dispenser",
      time: "09:30 AM",
      category: "FACILITY",
      message:
        "Sensors, ESP32 boards, and Raspberry Pis are available at the Tech Support Desk in Turing Hall. Please check out hardware using your Team ID.",
      isImportant: false,
    },
    {
      id: "ann-04",
      title: "Welcome to VISTRA Hackathon 2026",
      time: "08:30 AM",
      category: "GENERAL",
      message:
        "Welcome participants! Wifi credentials and room maps are now live on your participant dashboard. Best of luck building!",
      isImportant: false,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-pink-400 uppercase">
            Broadcast Feed
          </span>
          <StatusBadge status="ACTIVE" />
        </div>
        <h1 className="text-xl font-bold font-mono text-white mt-1">
          Official Announcements & Alerts
        </h1>
        <p className="text-xs text-slate-400">
          Real-time broadcasts dispatched by Event Directors and Coordinators
        </p>
      </div>

      <div className="space-y-3">
        {announcements.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border transition ${
              item.isImportant
                ? "border-amber-500/30 bg-amber-500/5 shadow-md shadow-amber-500/5"
                : "border-slate-800 bg-slate-900/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {item.category}
                </span>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{item.time}</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
