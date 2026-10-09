"use client";

import React from "react";
import { KPICard, ChartCard } from "@/components/ui/KPICard";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const incidentCategoryData = [
  { category: "NETWORK", count: 2 },
  { category: "POWER", count: 1 },
  { category: "HARDWARE", count: 1 },
  { category: "FACILITY", count: 1 },
  { category: "MEDICAL", count: 1 },
];

export default function AnalyticsIncidentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">Incident & Risk Telemetry</h2>
        <p className="text-xs text-slate-400">
          MTTR (Mean Time to Resolution), root cause categories, and facility resilience.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Incidents" value="6 Reported" subtitle="5 Resolved, 1 In Progress" icon={<AlertTriangle className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Mean Time To Resolve" value="18.2 mins" accentColor="emerald" subtitle="SLA Target < 30 mins" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Zero Downtime" value="99.94%" accentColor="sky" subtitle="Primary Network SLA" icon={<ShieldAlert className="w-4 h-4 text-sky-400" />} />
      </div>

      <ChartCard title="Incidents by Operational Category" subtitle="Breakdown of support tickets logged">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incidentCategoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
