"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import { ArrowLeft, Trophy, Award, CheckCircle2, Download, Send, Sparkles } from "lucide-react";

export default function ResourceManagerCertificatesPage() {
  const router = useRouter();
  const [issuedCount, setIssuedCount] = useState(360);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAll = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert("Successfully batch-generated cryptographic completion certificates for all 120 teams!");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/resource-manager")}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Dashboard
            </Button>
            <span className="font-mono text-xs text-rose-400 font-bold uppercase">
              Awards & Credentials
            </span>
          </div>
          <h1 className="text-xl font-bold font-mono text-white mt-1">Certificate Issuance Engine</h1>
          <p className="text-xs text-slate-400">
            Cryptographically signed verification certificates for attendees, finalists, and mentors
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          isLoading={isGenerating}
          leftIcon={<Sparkles className="w-4 h-4" />}
          onClick={handleGenerateAll}
        >
          Batch Generate Certificates
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Eligible Recipients" value="360 Attendees" subtitle="Across 120 Teams" icon={<Award className="w-4 h-4 text-purple-400" />} />
        <KPICard title="Generated & Signed" value={issuedCount} accentColor="emerald" subtitle="Ready for distribution" icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Special Winner Honors" value="15 Certificates" accentColor="amber" subtitle="Top 3 + Category Awards" icon={<Trophy className="w-4 h-4 text-amber-400" />} />
      </div>

      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          Certificate Templates & Formats
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="font-mono text-indigo-400 font-semibold block">TEMPLATE 1</span>
            <h4 className="text-sm font-bold text-white">Participation & Hack Completion</h4>
            <p className="text-slate-400 text-[11px]">
              Awarded to all checked-in team members with GitHub submission verified by jury.
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Preview PDF
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="font-mono text-amber-400 font-semibold block">TEMPLATE 2</span>
            <h4 className="text-sm font-bold text-white">Finalist & Winner Distinction</h4>
            <p className="text-slate-400 text-[11px]">
              Custom high-res certificates with cash prize tier, sponsor badges, and Director signatures.
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Preview PDF
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="font-mono text-emerald-400 font-semibold block">TEMPLATE 3</span>
            <h4 className="text-sm font-bold text-white">Jury & Mentor Recognition</h4>
            <p className="text-slate-400 text-[11px]">
              Honoring technical staff, volunteer leads, and academic evaluators.
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Preview PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
