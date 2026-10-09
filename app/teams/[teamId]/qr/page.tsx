"use client";

import React from "react";
import { useParams } from "next/navigation";
import { mockTeams } from "@/lib/mock-data/teams";
import { QRCard } from "@/components/ui/QRCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TeamQrPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const team = mockTeams.find((t) => t.id === teamId) || mockTeams[0];

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/teams/${team.id}`}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Digital EventPass Credential</h2>
          <p className="text-xs text-slate-400">High-speed verification token for turnstiles & jury desks.</p>
        </div>
      </div>

      <QRCard
        teamId={team.id}
        teamName={team.name}
        tokenId={team.qrCodeToken}
        venueName={team.assignedVenueName || team.assignedVenue}
        benchLabel={team.assignedBench}
      />
    </div>
  );
}
