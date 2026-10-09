"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockTeams } from "@/lib/mock-data/teams";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { QRCard } from "@/components/ui/QRCard";
import { teamsApi } from "@/lib/api/teams";
import {
  Users,
  Building,
  Scale,
  QrCode,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Code2,
  Cpu,
} from "lucide-react";
import Link from "next/link";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const team = mockTeams.find((t) => t.id === teamId) || mockTeams[0];
  const [currentTeam, setCurrentTeam] = useState(team);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleCheckIn = async () => {
    setIsUpdating(true);
    const nextStatus = currentTeam.checkInStatus === "CHECKED_IN" ? "ABSENT" : "CHECKED_IN";
    const updated = await teamsApi.updateCheckIn(currentTeam.id, nextStatus);
    setCurrentTeam(updated);
    setIsUpdating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/teams"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-400">{currentTeam.id}</span>
              <StatusBadge status={currentTeam.checkInStatus} />
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                {currentTeam.project.domain}
              </span>
            </div>
            <h2 className="text-xl font-bold font-mono text-white mt-1">{currentTeam.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant={currentTeam.checkInStatus === "CHECKED_IN" ? "outline" : "success"}
            onClick={toggleCheckIn}
            isLoading={isUpdating}
          >
            {currentTeam.checkInStatus === "CHECKED_IN" ? "Mark as Absent" : "Check In Now ✓"}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => router.push(`/teams/${currentTeam.id}/qr`)}
            leftIcon={<QrCode className="w-3.5 h-3.5" />}
          >
            Digital Pass
          </Button>
        </div>
      </div>

      {/* Grid: Left team specs, Right QR card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Project Abstract Card */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>Project: {currentTeam.project.title}</span>
              </div>
              <Link
                href={`/teams/${currentTeam.id}/project`}
                className="text-xs text-indigo-400 hover:underline"
              >
                Full Project View →
              </Link>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentTeam.project.abstract}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {currentTeam.project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-950 text-slate-300 border border-slate-800"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Allocations & Jury Card */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Assigned Operational Logistics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Assigned Suite</span>
                </div>
                <div className="font-semibold text-slate-200">{currentTeam.assignedVenueName || currentTeam.assignedVenue}</div>
                <div className="text-[11px] font-mono text-indigo-400 font-bold">{currentTeam.assignedBench}</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  <span>Jury Evaluators</span>
                </div>
                <div className="font-semibold text-slate-200">
                  {currentTeam.assignedJudges.join(" & ") || "Pending OR-Tools"}
                </div>
                <div className="text-[11px] text-slate-500">Dual Evaluator Panel</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Evaluation Score</span>
                </div>
                <div className="font-bold text-lg text-emerald-400 font-mono">
                  {currentTeam.totalScore || "—"} / 100
                </div>
                <div className="text-[11px] text-slate-500">Round {currentTeam.currentRound} Assessment</div>
              </div>
            </div>
          </div>

          {/* Members Roster Card */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Team Roster ({currentTeam.members.length} Members)
              </h4>
              <Link
                href={`/teams/${currentTeam.id}/members`}
                className="text-xs text-indigo-400 hover:underline"
              >
                Manage Members →
              </Link>
            </div>

            <div className="divide-y divide-slate-800">
              {currentTeam.members.map((mem) => (
                <div key={mem.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{mem.name}</span>
                      {mem.role === "LEADER" && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Captain
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{mem.email} • {mem.organizationOrSchool}</span>
                  </div>
                  <StatusBadge status={mem.checkInStatus} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right QR Pass Column */}
        <div className="space-y-4">
          <QRCard
            teamId={currentTeam.id}
            teamName={currentTeam.name}
            tokenId={currentTeam.qrCodeToken}
            venueName={currentTeam.assignedVenueName || currentTeam.assignedVenue}
            benchLabel={currentTeam.assignedBench}
          />
        </div>
      </div>
    </div>
  );
}
