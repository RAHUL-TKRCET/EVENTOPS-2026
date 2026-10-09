"use client";

import React, { useState } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KPICard } from "@/components/ui/KPICard";
import { ProgressBar } from "@/components/ui/Feedback";
import { mockResources } from "@/lib/mock-data/resources";
import { ResourceItem } from "@/types";
import { Box, Utensils, Cpu, Award, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResourcesOverviewPage() {
  const router = useRouter();
  const [resources, setResources] = useState<ResourceItem[]>(mockResources);

  const columns: Column<ResourceItem>[] = [
    {
      key: "name",
      header: "Resource Description",
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-100">{r.name}</div>
          <div className="text-[11px] text-slate-500 font-mono">{r.location}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (r) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
          {r.category}
        </span>
      ),
    },
    {
      key: "status",
      header: "Stock Health",
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "utilization",
      header: "Consumed / Total",
      render: (r) => {
        const remaining = r.totalQuantity - r.consumedQuantity;
        const pct = Math.round((r.consumedQuantity / r.totalQuantity) * 100);

        return (
          <div className="w-48 space-y-1 text-xs">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-slate-300">{r.consumedQuantity} {r.unit} used</span>
              <span className="text-emerald-400 font-bold">{remaining} left</span>
            </div>
            <ProgressBar value={pct} color={pct > 80 ? "amber" : "emerald"} />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Logistics, Food & Hardware Depots</h2>
          <p className="text-xs text-slate-400">
            Real-time depletion telemetry across catering boxes, hardware development kits, and badges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/resources/food")}
            leftIcon={<Utensils className="w-3.5 h-3.5 text-amber-400" />}
          >
            Meal Passes
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => router.push("/resources/equipment")}
            leftIcon={<Cpu className="w-3.5 h-3.5" />}
          >
            Hardware Vault
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard title="Meal Boxes Left" value="238" change="Day 1 Dinner" changeType="positive" accentColor="emerald" icon={<Utensils className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Dev Kits Deployed" value="28 / 30" subtitle="Jetson Nano" accentColor="amber" icon={<Cpu className="w-4 h-4 text-amber-400" />} />
        <KPICard title="NFC Badges Printed" value="495 / 600" subtitle="99% Enrolled" accentColor="sky" icon={<Box className="w-4 h-4 text-sky-400" />} />
        <KPICard title="Depot Health" value="Normal" subtitle="2 Low Stock Warnings" accentColor="violet" />
      </div>

      <DataTable
        data={resources}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchPlaceholder="Filter inventory by resource name or depot..."
      />
    </div>
  );
}
