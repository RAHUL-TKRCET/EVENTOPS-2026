"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { defaultHardConstraints, defaultSoftConstraints } from "@/lib/mock-data/allocations";
import { HardConstraint, SoftConstraint } from "@/types";
import { ArrowLeft, ArrowRight, ShieldAlert, Sliders, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ConstraintBuilderPage() {
  const router = useRouter();
  const [hardConstraints, setHardConstraints] = useState<HardConstraint[]>(defaultHardConstraints);
  const [softConstraints, setSoftConstraints] = useState<SoftConstraint[]>(defaultSoftConstraints);

  const toggleHard = (id: string) => {
    setHardConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const updateSoftWeight = (id: string, weight: number) => {
    setSoftConstraints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, weight } : c))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/allocation/requirements"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="font-mono text-xs text-indigo-400 font-bold uppercase">
              Step 2 of 5: Constraint Builder
            </span>
            <h2 className="text-xl font-bold font-mono text-white mt-0.5">
              Mathematical Optimization Rules
            </h2>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => router.push("/allocation/optimization")}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Configure & Run Solver
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hard Constraints (Must NEVER be violated) */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Hard Constraints (Non-Negotiable)</h3>
              <p className="text-xs text-slate-400">Violating any hard constraint returns INFEASIBLE in CP-SAT.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {hardConstraints.map((hc) => (
              <div
                key={hc.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{hc.name}</span>
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      CRITICAL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{hc.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={hc.enabled}
                    onChange={() => toggleHard(hc.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Soft Constraints (Objective Function Weights) */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Soft Objectives (Penalty Weights)</h3>
              <p className="text-xs text-slate-400">CP-SAT optimizes objective function: Maximize Σ(W_i * Sat_i).</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {softConstraints.map((sc) => (
              <div
                key={sc.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{sc.name}</span>
                  <span className="font-mono text-xs text-indigo-400 font-bold">
                    Weight: {sc.weight} / 10
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{sc.description}</p>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sc.weight}
                  onChange={(e) => updateSoftWeight(sc.id, parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
