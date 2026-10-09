"use client";

import React from "react";
import { KPICard } from "@/components/ui/KPICard";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Cpu, Zap, Wifi, Layers, Users, Scale } from "lucide-react";
import Link from "next/link";

export default function AllocationRequirementsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/allocation"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="font-mono text-xs text-indigo-400 font-bold uppercase">
              Step 1 of 5: Requirements Analysis
            </span>
            <h2 className="text-xl font-bold font-mono text-white mt-0.5">
              Input Demands & Resource Envelope
            </h2>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => router.push("/allocation/constraints")}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Proceed to Constraints
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard title="Teams To Allocate" value="120" subtitle="100% Eligible" icon={<Users className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Available Benches" value="120" subtitle="24 Active Suites" accentColor="emerald" icon={<Layers className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Jury Evaluators" value="20" subtitle="Capacity: 160 Slots" accentColor="sky" icon={<Scale className="w-4 h-4 text-sky-400" />} />
        <KPICard title="Available Time Slots" value="4 Slots" subtitle="Round 1 Window" accentColor="violet" icon={<Cpu className="w-4 h-4 text-violet-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Track Demands */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Domain Affinity Ingestion</h3>
          <p className="text-xs text-slate-400">
            Semantic embeddings analyzed from project abstracts mapped to evaluator expertise.
          </p>
          <div className="space-y-2 text-xs">
            {[
              { track: "AI / Machine Learning", teams: 28, judges: 6, ratio: "Balanced" },
              { track: "Distributed Systems / Web3", teams: 20, judges: 4, ratio: "Balanced" },
              { track: "FinTech & Payments", teams: 18, judges: 3, ratio: "Balanced" },
              { track: "HealthTech & Bio", teams: 16, judges: 3, ratio: "Slight Load" },
              { track: "IoT & Robotics", teams: 14, judges: 2, ratio: "Tight Load" },
              { track: "CleanTech & Green Energy", teams: 12, judges: 2, ratio: "Balanced" },
              { track: "CyberSecurity", teams: 12, judges: 2, ratio: "Balanced" },
            ].map((row) => (
              <div key={row.track} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">{row.track}</span>
                  <p className="text-[11px] text-slate-500 font-mono">{row.teams} teams • {row.judges} evaluators</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {row.ratio}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hardware & Infrastructure Prerequisites */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Hardware & Spatial Prerequisite Demands</h3>
          <p className="text-xs text-slate-400">
            Hard constraints to ensure teams are assigned only to rooms with adequate equipment.
          </p>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="font-semibold text-slate-200">High-Current 16A Dedicated Power</span>
                  <p className="text-[11px] text-slate-500">18 teams requested high-draw GPU/hardware supplies</p>
                </div>
              </div>
              <span className="font-mono text-emerald-400 font-bold">24 Suites Ready</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wifi className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="font-semibold text-slate-200">10Gbps Low-Latency Optical LAN</span>
                  <p className="text-[11px] text-slate-500">Distributed & Web3 node synchronization</p>
                </div>
              </div>
              <span className="font-mono text-emerald-400 font-bold">All 24 Suites Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
