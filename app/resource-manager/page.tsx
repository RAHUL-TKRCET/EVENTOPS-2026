"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockResources } from "@/lib/mock-data/resources";
import {
  Box,
  Utensils,
  Trophy,
  ShieldCheck,
  QrCode,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

export default function ResourceManagerDashboardPage() {
  const router = useRouter();

  const [mealsServed, setMealsServed] = useState(240);
  const totalMeals = 360;
  const kitsDistributed = 112;
  const totalKits = 120;
  const badgesPrinted = 480;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl border border-rose-500/20 bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Resource Operations Command
            </span>
            <StatusBadge status="ACTIVE" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-white mt-1">
            Resource & Distribution Management
          </h1>
          <p className="text-xs text-slate-400">
            Catering dispatch, dietary meal verification, swag kit issuance, and digital badge logistics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            leftIcon={<QrCode className="w-4 h-4" />}
            onClick={() => router.push("/resource-manager/distribution")}
          >
            Launch Distribution Scanner
          </Button>
        </div>
      </div>

      {/* Role Scoping Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            Resource Manager Clearance: You have permissions over inventory tracking, meal tokens, kit distribution, and badges. Team scoring and optimization are restricted.
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">INVENTORY AUDITED</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard
          title="Lunch Meals Served"
          value={`${mealsServed} / ${totalMeals}`}
          accentColor="emerald"
          subtitle={`${Math.round((mealsServed / totalMeals) * 100)}% Consumed`}
          icon={<Utensils className="w-4 h-4 text-emerald-400" />}
        />
        <KPICard
          title="Swag Kits Claimed"
          value={`${kitsDistributed} / ${totalKits}`}
          accentColor="sky"
          subtitle="8 Pending Pickup"
          icon={<Box className="w-4 h-4 text-sky-400" />}
        />
        <KPICard
          title="Badges Issued"
          value={badgesPrinted}
          accentColor="indigo"
          subtitle="100% Verification"
          icon={<ShieldCheck className="w-4 h-4 text-indigo-400" />}
        />
        <KPICard
          title="Low Stock Alerts"
          value="1 Item"
          accentColor="amber"
          subtitle="Hardware Pis (Pool)"
          icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase">
              <Utensils className="w-4 h-4" />
              <span>Catering & Meals</span>
            </div>
            <h3 className="text-base font-bold text-white">Dietary Distribution</h3>
            <p className="text-xs text-slate-400">
              Track real-time scans across Veg, Non-Veg, Jain, and Vegan counters at Dining Hall B.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2"
            onClick={() => router.push("/resource-manager/meals")}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Manage Meals
          </Button>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase">
              <Box className="w-4 h-4" />
              <span>Swag Kits & Badges</span>
            </div>
            <h3 className="text-base font-bold text-white">Attendee Kit Issuance</h3>
            <p className="text-xs text-slate-400">
              Audit check-ins, hoodie sizes, welcome lanyards, and hardware development kits.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2"
            onClick={() => router.push("/resource-manager/badges")}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Manage Badges & Kits
          </Button>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold uppercase">
              <Trophy className="w-4 h-4" />
              <span>Certificates & Prizes</span>
            </div>
            <h3 className="text-base font-bold text-white">Award Generation</h3>
            <p className="text-xs text-slate-400">
              Batch generate cryptographic verification certificates for finalists and participants.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2"
            onClick={() => router.push("/resource-manager/certificates")}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Issue Certificates
          </Button>
        </div>
      </div>

      {/* Inventory Health Table */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
            Live Inventory Health
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/resources/inventory")}
          >
            All Inventory Items →
          </Button>
        </div>

        <div className="divide-y divide-slate-800 text-xs">
          {mockResources.slice(0, 5).map((res) => {
            const pct = Math.round((res.consumedQuantity / res.totalQuantity) * 100);

            return (
              <div key={res.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{res.name}</span>
                    <StatusBadge status={res.status} />
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Category: {res.category} • Location: {res.location}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="font-mono text-slate-300 font-semibold">
                      {res.consumedQuantity} / {res.totalQuantity} {res.unit}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {pct}% Claimed
                    </span>
                  </div>
                  <div className="w-24 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        pct > 80 ? "bg-amber-400" : "bg-indigo-500"
                      }`}
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
