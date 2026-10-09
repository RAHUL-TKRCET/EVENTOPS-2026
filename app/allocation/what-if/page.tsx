"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { allocationApi } from "@/lib/api/allocation";
import { ArrowLeft, Play, AlertTriangle, Cpu, CheckCircle2, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function WhatIfLabPage() {
  const [selectedScenario, setSelectedScenario] = useState<"JUDGE_DROPOUT" | "VENUE_POWER_OUTAGE" | "EXTRA_TEAMS">("JUDGE_DROPOUT");
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = async () => {
    setIsSimulating(true);
    const result = await allocationApi.simulateWhatIf(selectedScenario);
    setSimulationResult(result);
    setIsSimulating(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/allocation/results"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="font-mono text-xs text-indigo-400 font-bold uppercase">
            Step 7: What-If Contingency Simulation
          </span>
          <h2 className="text-xl font-bold font-mono text-white mt-0.5">
            Operational Stress & Resilience Sandbox
          </h2>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Select Stress Scenario</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => setSelectedScenario("JUDGE_DROPOUT")}
            className={`p-4 rounded-xl border text-xs space-y-1 transition cursor-pointer ${
              selectedScenario === "JUDGE_DROPOUT"
                ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
            }`}
          >
            <span className="font-bold text-slate-100">Scenario A: Evaluator Dropout</span>
            <p className="text-[11px] text-slate-400">Judge J007 declares emergency absence for Slot B.</p>
          </div>

          <div
            onClick={() => setSelectedScenario("VENUE_POWER_OUTAGE")}
            className={`p-4 rounded-xl border text-xs space-y-1 transition cursor-pointer ${
              selectedScenario === "VENUE_POWER_OUTAGE"
                ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
            }`}
          >
            <span className="font-bold text-slate-100">Scenario B: Room Power Failure</span>
            <p className="text-[11px] text-slate-400">Circuit breaker trip in Room R002 disabling 5 benches.</p>
          </div>

          <div
            onClick={() => setSelectedScenario("EXTRA_TEAMS")}
            className={`p-4 rounded-xl border text-xs space-y-1 transition cursor-pointer ${
              selectedScenario === "EXTRA_TEAMS"
                ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
            }`}
          >
            <span className="font-bold text-slate-100">Scenario C: Wildcard Expansion</span>
            <p className="text-[11px] text-slate-400">10 wildcard teams admitted beyond initial 120 quota.</p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            variant="primary"
            size="md"
            isLoading={isSimulating}
            onClick={runSimulation}
            leftIcon={<Cpu className="w-4 h-4" />}
          >
            Simulate Re-Optimization
          </Button>
        </div>
      </div>

      {simulationResult && (
        <div className="p-6 rounded-2xl border border-indigo-500/30 bg-slate-900/90 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-semibold text-slate-100">Simulated CP-SAT Contingency Plan</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              Recovered Score: {simulationResult.reOptimizationScore}%
            </span>
          </div>

          <p className="text-xs text-slate-300 font-medium">{simulationResult.impactSummary}</p>

          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
              Recommended Automated Actions:
            </h4>
            {simulationResult.recommendedActions.map((act: string, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{act}</span>
              </div>
            ))}
          </div>

          <Button
            size="sm"
            variant="success"
            className="w-full mt-2"
            onClick={() => alert("Contingency plan dispatched! Affected rooms and judges notified.")}
          >
            Execute Live Contingency Reroute ✓
          </Button>
        </div>
      )}
    </div>
  );
}
