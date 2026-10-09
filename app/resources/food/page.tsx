"use client";

import React, { useState } from "react";
import { KPICard } from "@/components/ui/KPICard";
import { ProgressBar } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { Utensils, ArrowLeft, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";

interface MealBatch {
  id: string;
  name: string;
  total: number;
  served: number;
  window: string;
  status: "SERVING" | "UPCOMING" | "CONCLUDED";
}

export default function FoodManagementPage() {
  const [batches, setBatches] = useState<MealBatch[]>([
    { id: "m1", name: "Day 1 Dinner (Veg & Continental)", total: 650, served: 412, window: "07:30 PM - 09:30 PM", status: "SERVING" },
    { id: "m2", name: "Midnight Pizza & Cold Brew Fuel", total: 400, served: 0, window: "01:00 AM - 02:30 AM", status: "UPCOMING" },
    { id: "m3", name: "Day 2 Breakfast (High Protein)", total: 600, served: 0, window: "07:30 AM - 09:30 AM", status: "UPCOMING" },
    { id: "m4", name: "Day 1 Welcome Lunch", total: 650, served: 638, window: "12:30 PM - 02:30 PM", status: "CONCLUDED" },
  ]);

  const serveMeal = (batchId: string) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, served: Math.min(b.total, b.served + 1) } : b))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/resources"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Catering & Meal Pass Tracking</h2>
          <p className="text-xs text-slate-400">
            Real-time meal consumption audit to prevent food wastage and track dietary allotments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Current Active Batch" value="Day 1 Dinner" subtitle="Window: 07:30 PM - 09:30 PM" icon={<Utensils className="w-4 h-4 text-amber-400" />} />
        <KPICard title="Served Meal Passes" value="412" change="63% of Batch" changeType="positive" accentColor="emerald" icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Remaining Portions" value="238" subtitle="Buffet depot active" accentColor="sky" />
      </div>

      <div className="space-y-4">
        {batches.map((batch) => {
          const remaining = batch.total - batch.served;
          const pct = Math.round((batch.served / batch.total) * 100);

          return (
            <div key={batch.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-100">{batch.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      batch.status === "SERVING"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {batch.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{batch.window}</p>
                </div>

                {batch.status === "SERVING" && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => serveMeal(batch.id)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Scan Meal Pass (+1)
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Served: {batch.served} / {batch.total} ({pct}%)</span>
                  <span className="text-emerald-400 font-bold">{remaining} Remaining</span>
                </div>
                <ProgressBar value={pct} color={pct > 85 ? "amber" : "emerald"} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
