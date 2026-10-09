"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Download, FileText, CheckCircle2, Share2, Sparkles, Filter } from "lucide-react";

export default function ReportsPage() {
  const [selectedFormat, setSelectedFormat] = useState("PDF");
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setDownloadReady(true);
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Executive Event Reports & Compliance Audit</h2>
          <p className="text-xs text-slate-400">
            Generate verifiable post-event analytics, jury score sheets, and operational audits.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          isLoading={isGenerating}
          onClick={handleGenerate}
          leftIcon={<FileText className="w-4 h-4" />}
        >
          Generate Official Dossier
        </Button>
      </div>

      {/* Filter and Format Controls */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span>Report Scope Configuration</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Target Event"
            defaultValue="evt-01"
            options={[
              { value: "evt-01", label: "VISTRA Hackathon 2026 (Live)" },
              { value: "evt-02", label: "Enterprise AI Summit 2026" },
              { value: "evt-03", label: "Robotic Combat Fest 2026" },
            ]}
          />

          <Select
            label="Tournament Stage"
            defaultValue="all-rounds"
            options={[
              { value: "all-rounds", label: "Full Event Lifecycle (R1 - Finals)" },
              { value: "round-1", label: "Round 1 Screening Only" },
              { value: "round-2", label: "Round 2 Prototype Demo Only" },
            ]}
          />

          <Select
            label="Export Format"
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            options={[
              { value: "PDF", label: "Official Certified PDF Dossier" },
              { value: "CSV", label: "Raw Tabular CSV (All 120 Teams)" },
              { value: "JSON", label: "Full JSON Schema Audit Payload" },
            ]}
          />
        </div>
      </div>

      {/* Report Generation Result Card */}
      {downloadReady && (
        <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Executive Dossier Compiled Successfully</span>
            </div>
            <span className="font-mono text-xs text-slate-400">SHA-256 Verified</span>
          </div>

          <p className="text-xs text-slate-300">
            Includes Turnstile Ingress telemetry (114 checked-in), OR-Tools CP-SAT solver allocation proof (zero hard violations), 20 jury rubric breakdowns, and verified Round 1 leaderboard rankings.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              size="sm"
              variant="success"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => alert(`Downloaded VISTRA_Hackathon_2026_Executive_Report.${selectedFormat.toLowerCase()}`)}
            >
              Download {selectedFormat} Document
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Share2 className="w-4 h-4" />}
              onClick={() => alert("Permanent public verification URL copied to clipboard.")}
            >
              Copy Verification URL
            </Button>
          </div>
        </div>
      )}

      {/* Report Sample Preview Mock */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-indigo-400 font-bold uppercase tracking-wider">
            Report Preview: EVENTOPS-VISTRA-2026-FINAL.pdf
          </span>
          <span className="text-slate-500">Page 1 of 8</span>
        </div>

        <div className="space-y-2 text-slate-300">
          <div className="text-sm font-bold text-white">EVENTOPS EXECUTIVE OPERATIONS DOSSIER</div>
          <div className="text-slate-500 text-[11px]">Event: VISTRA Hackathon 2026 • Tenant: VISTRA Global Tech</div>
          <div className="pt-2 text-slate-400 leading-relaxed font-sans text-xs">
            120 registered innovation teams across 7 technical tracks were evaluated by 20 accredited domain judges across 24 suites. All schedules were verified by Google OR-Tools CP-SAT with 0 hard constraint violations and a 98.2% soft constraint satisfaction score.
          </div>
        </div>
      </div>
    </div>
  );
}
