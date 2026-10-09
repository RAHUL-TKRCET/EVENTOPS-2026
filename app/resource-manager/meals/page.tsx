"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { KPICard } from "@/components/ui/KPICard";
import { ArrowLeft, Utensils, QrCode, CheckCircle2, Users } from "lucide-react";

export default function ResourceManagerMealsPage() {
  const router = useRouter();

  const dietaryData = [
    { type: "Vegetarian (Veg)", total: 180, served: 135, location: "Counter 1 & 2" },
    { type: "Non-Vegetarian (Chicken/Egg)", total: 120, served: 88, location: "Counter 3" },
    { type: "Jain Vegetarian (Strict)", total: 40, served: 32, location: "Counter 4 (Dedicated)" },
    { type: "Vegan (Plant-based)", total: 20, served: 15, location: "Counter 4 (Dedicated)" },
  ];

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
              Catering Operations
            </span>
          </div>
          <h1 className="text-xl font-bold font-mono text-white mt-1">Meal Tracking & Distribution</h1>
          <p className="text-xs text-slate-400">
            Real-time verification against participant dietary preference registry
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<QrCode className="w-4 h-4" />}
          onClick={() => router.push("/resource-manager/distribution")}
        >
          Scan Meal Token
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard title="Total Ordered" value="360 Meals" subtitle="Budget: Catered" icon={<Utensils className="w-4 h-4 text-rose-400" />} />
        <KPICard title="Meals Claimed" value="270" accentColor="emerald" subtitle="75% Served" icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Remaining" value="90 Meals" accentColor="sky" subtitle="Buffer Safe" icon={<Users className="w-4 h-4 text-sky-400" />} />
        <KPICard title="Dietary Compliance" value="100%" accentColor="indigo" subtitle="Zero cross-contamination" icon={<CheckCircle2 className="w-4 h-4 text-indigo-400" />} />
      </div>

      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          Dietary Category Quotas & Served Counts
        </h3>

        <div className="divide-y divide-slate-800">
          {dietaryData.map((d, idx) => {
            const pct = Math.round((d.served / d.total) * 100);

            return (
              <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="text-sm font-semibold text-white">{d.type}</h4>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Location: {d.location}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="font-mono text-white font-bold">{d.served} / {d.total}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{pct}% Served</span>
                  </div>
                  <div className="w-28 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
