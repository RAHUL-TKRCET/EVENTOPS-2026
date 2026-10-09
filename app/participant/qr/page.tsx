"use client";

import React, { useState } from "react";
import { mockTeams } from "@/lib/mock-data/teams";
import { QRCard } from "@/components/ui/QRCard";
import { ShieldCheck, Info, AlertCircle, Copy, Check, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ParticipantQRPage() {
  const team = mockTeams.find((t) => t.id === "T042") || mockTeams[0];
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(team.qrCodeToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-pink-500/10 text-pink-400 border border-pink-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>OFFICIAL DIGITAL EVENTPASS • DISPLAY ONLY</span>
        </div>
        <h1 className="text-2xl font-bold font-mono text-white">My Digital EventPass</h1>
        <p className="text-xs text-slate-400">
          Present this verified pass to Volunteers, Coordinators, and Resource Managers
        </p>
      </div>

      {/* RBAC Notice: Participant Cannot Scan */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-white">Participant Badge Policy:</span>
          <p className="text-slate-400 leading-relaxed">
            As an Event Participant, your portal is configured for <strong className="text-slate-200">credential display only</strong>. QR camera scanners are strictly reserved for operational staff (Coordinators, Volunteers, Judges, and Resource Managers) to maintain event security and audit compliance.
          </p>
        </div>
      </div>

      {/* Official QR Pass Card */}
      <QRCard
        teamId={team.id}
        teamName={team.name}
        tokenId={team.qrCodeToken}
        venueName={team.assignedVenueName || `Hall Turing • Room ${team.assignedVenue}`}
        benchLabel={`Workstation ${team.assignedBench}`}
      />

      {/* Fast actions */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span>Security Token Verification Hash:</span>
          <span className="font-mono text-emerald-400 font-semibold">VALIDATED</span>
        </div>
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
          <span className="truncate max-w-[280px]">{team.qrCodeToken}</span>
          <button
            onClick={handleCopy}
            className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
            title="Copy Token"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
