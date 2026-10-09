"use client";

import React from "react";
import { Stepper } from "@/components/ui/Feedback";
import { KPICard } from "@/components/ui/KPICard";
import { Button } from "@/components/ui/Button";
import { Cpu, ArrowRight, ShieldCheck, Sliders, CheckCircle2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const steps = [
  { id: "req", title: "1. Requirements", subtitle: "Demands & tracks", href: "/allocation/requirements" },
  { id: "cons", title: "2. Constraints", subtitle: "Hard & soft rules", href: "/allocation/constraints" },
  { id: "opt", title: "3. Optimization", subtitle: "OR-Tools CP-SAT", href: "/allocation/optimization" },
  { id: "res", title: "4. Results Matrix", subtitle: "Review & apply", href: "/allocation/results" },
  { id: "whatif", title: "5. What-If Labs", subtitle: "Scenario sandbox", href: "/allocation/what-if" },
];

export default function AllocationDashboardPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              CORE USP ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">Google OR-Tools CP-SAT Backend</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-mono text-white mt-1">
            Intelligent Constraint Allocation
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Automated mathematical optimization balancing judge workloads, domain semantic affinities, bench hardware requirements, and conflict-of-interest prohibitions.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Cpu className="w-4 h-4" />}
          onClick={() => router.push("/allocation/optimization")}
        >
          Run Solver Pipeline
        </Button>
      </div>

      {/* Conceptual Architecture Graphic Banner */}
      <div className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">
          Optimization Pipeline Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
            <span className="font-mono text-indigo-400 font-bold">STEP 1</span>
            <h4 className="font-semibold text-slate-200">AI Requirement Understanding</h4>
            <p className="text-[11px] text-slate-400">Extracts domain affinities & hardware needs from project abstracts.</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
            <span className="font-mono text-sky-400 font-bold">STEP 2</span>
            <h4 className="font-semibold text-slate-200">Structured Constraints</h4>
            <p className="text-[11px] text-slate-400">Strict zero-double-booking, conflicts of interest, and power limits.</p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1">
            <span className="font-mono text-amber-400 font-bold">STEP 3</span>
            <h4 className="font-semibold text-slate-200">Constraint Builder</h4>
            <p className="text-[11px] text-slate-400">Weight matrix configuration for soft objectives (σ &lt; 0.8).</p>
          </div>

          <div className="p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-900/20 space-y-1 ring-1 ring-indigo-500/30">
            <span className="font-mono text-indigo-300 font-bold">STEP 4</span>
            <h4 className="font-semibold text-white">OR-Tools CP-SAT</h4>
            <p className="text-[11px] text-indigo-200">Constraint programming solver finding optimal allocation in ~1.4s.</p>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 space-y-1">
            <span className="font-mono text-emerald-400 font-bold">STEP 5</span>
            <h4 className="font-semibold text-slate-200">Optimized Deployment</h4>
            <p className="text-[11px] text-slate-400">Instant synchronized team benches & jury routing schedules.</p>
          </div>
        </div>
      </div>

      {/* Pipeline Navigation Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((st) => (
          <Link
            key={st.id}
            href={st.href}
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:bg-slate-800/80 hover:border-slate-700 transition flex items-start justify-between group"
          >
            <div>
              <span className="font-mono text-[10px] text-indigo-400 font-bold uppercase">{st.subtitle}</span>
              <h4 className="text-sm font-semibold text-slate-100 group-hover:text-white mt-0.5">{st.title}</h4>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition" />
          </Link>
        ))}
      </div>
    </div>
  );
}
