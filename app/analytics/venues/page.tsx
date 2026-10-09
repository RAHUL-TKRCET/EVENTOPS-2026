"use client";

import React from "react";
import { KPICard, ChartCard } from "@/components/ui/KPICard";
import { Building, Zap, Wifi } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const suiteOccupancy = [
  { suite: "R001", occupied: 5, total: 5 },
  { suite: "R002", occupied: 5, total: 5 },
  { suite: "R003", occupied: 5, total: 5 },
  { suite: "R004", occupied: 5, total: 5 },
  { suite: "R005", occupied: 5, total: 5 },
  { suite: "R006", occupied: 4, total: 5 },
  { suite: "R007", occupied: 5, total: 5 },
  { suite: "R008", occupied: 4, total: 5 },
  { suite: "R023", occupied: 1, total: 5 },
  { suite: "R024", occupied: 0, total: 5 },
];

export default function AnalyticsVenuesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">Spatial & Venue Utilization Analytics</h2>
        <p className="text-xs text-slate-400">
          Occupancy distribution across 24 suites and 120 power-ready benches.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Overall Utilization" value="94.5%" subtitle="114 / 120 Benches" icon={<Building className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Dedicated 16A Power" value="100% Up" accentColor="emerald" subtitle="Zero Major Outages" icon={<Zap className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Network Bandwidth" value="4.8 Gbps" accentColor="sky" subtitle="Peak Ingress Throughput" icon={<Wifi className="w-4 h-4 text-sky-400" />} />
      </div>

      <ChartCard title="Bench Occupancy by Venue Suite" subtitle="Assigned hacker workstations per room">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={suiteOccupancy}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="suite" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 5]} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
              <Bar dataKey="occupied" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
