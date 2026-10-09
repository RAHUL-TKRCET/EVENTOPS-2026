"use client";

import React from "react";
import { useParams } from "next/navigation";
import { mockTeams } from "@/lib/mock-data/teams";
import { StatusBadge } from "@/components/ui/Badge";
import { ArrowLeft, User, Mail, Phone, School, Utensils } from "lucide-react";
import Link from "next/link";

export default function TeamMembersPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const team = mockTeams.find((t) => t.id === teamId) || mockTeams[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/teams/${team.id}`}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Team Members: {team.name}</h2>
          <p className="text-xs text-slate-400">Roster credentials, check-in status, and dietary allocations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.members.map((mem) => (
          <div key={mem.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-100">{mem.name}</h4>
                  {mem.role === "LEADER" && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
                      Team Captain
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{mem.organizationOrSchool}</p>
              </div>
              <StatusBadge status={mem.checkInStatus} />
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{mem.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{mem.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Utensils className="w-3.5 h-3.5 text-slate-500" />
                <span>Dietary: {mem.dietaryPreference || "Standard"} • Size: {mem.tShirtSize || "L"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
