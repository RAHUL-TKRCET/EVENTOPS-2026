"use client";

import React from "react";
import { useParams } from "next/navigation";
import { mockVolunteers, mockVolunteerTasks } from "@/lib/mock-data/volunteers";
import { StatusBadge } from "@/components/ui/Badge";
import { ArrowLeft, User, Phone, Mail, MapPin, Clock } from "lucide-react";
import Link from "next/link";

export default function VolunteerDetailPage() {
  const params = useParams();
  const volunteerId = params.volunteerId as string;
  const volunteer = mockVolunteers.find((v) => v.id === volunteerId) || mockVolunteers[0];
  const assignedTasks = mockVolunteerTasks.filter((t) => t.assignedVolunteerId === volunteer.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/volunteers"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="font-mono text-xs text-indigo-400 font-bold uppercase">{volunteer.id}</span>
          <h2 className="text-xl font-bold font-mono text-white mt-0.5">{volunteer.name}</h2>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="font-mono text-xs text-indigo-400 font-bold">{volunteer.role}</span>
          <StatusBadge status={volunteer.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
          <div>Email: <span className="text-white font-mono">{volunteer.email}</span></div>
          <div>Phone: <span className="text-white font-mono">{volunteer.phone}</span></div>
          <div>Assigned Zone: <span className="text-white">{volunteer.zone}</span></div>
          <div>Current Shift: <span className="text-white">{volunteer.currentShift}</span></div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider mb-2">
            Tasks Handled ({assignedTasks.length})
          </h4>
          <div className="space-y-2">
            {assignedTasks.map((task) => (
              <div key={task.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex justify-between items-center">
                <span className="text-slate-200 font-medium">{task.title}</span>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
