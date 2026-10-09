"use client";

import React from "react";
import { KPICard, ChartCard } from "@/components/ui/KPICard";
import { Box, Utensils, Cpu } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const resourceChartData = [
  { name: "Day 1 Dinner", consumed: 412, total: 650 },
  { name: "Energy Drinks", consumed: 980, total: 1200 },
  { name: "Jetson Dev Kits", consumed: 28, total: 30 },
  { name: "Welcome Kits", consumed: 480, total: 550 },
  { name: "RFID Badges", consumed: 495, total: 600 },
];

export default function AnalyticsResourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">Logistics & Resource Consumption Analytics</h2>
        <p className="text-xs text-slate-400">
          Depletion rates, food catering passes, and hardware vault allocations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Inventory Items" value="7 SKU Lines" subtitle="Food & Hardware" icon={<Box className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Food Wastage Rate" value="< 2.4%" accentColor="emerald" subtitle="Optimized by QR meal passes" icon={<Utensils className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Hardware Return Rate" value="100% Tracked" accentColor="sky" subtitle="RFID Vault Tagged" icon={<Cpu className="w-4 h-4 text-sky-400" />} />
      </div>

      <ChartCard title="Resource Depletion vs Total Supply" subtitle="Consumed quantity vs overall cache allocated">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={resourceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
              <Bar dataKey="consumed" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
