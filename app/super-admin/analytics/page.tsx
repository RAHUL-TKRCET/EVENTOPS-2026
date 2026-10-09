"use client";

import React from "react";
import { KPICard, ChartCard } from "@/components/ui/KPICard";
import { BarChart3, TrendingUp, Cpu, Server, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const tenantGrowthData = [
  { month: "May", orgs: 8, events: 14, activeUsers: 420 },
  { month: "Jun", orgs: 14, events: 26, activeUsers: 810 },
  { month: "Jul", orgs: 22, events: 38, activeUsers: 1240 },
  { month: "Aug", orgs: 31, events: 54, activeUsers: 1980 },
  { month: "Sep", orgs: 42, events: 72, activeUsers: 2850 },
  { month: "Oct", orgs: 56, events: 94, activeUsers: 3920 },
];

export default function SuperAdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white font-mono">Platform Health & Telemetry</h2>
        <p className="text-xs text-slate-400">
          Aggregated operations velocity, solver compute latencies, and tenant throughput.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Events Operated" value="94" change="+32% YoY" changeType="positive" icon={<BarChart3 className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Total Participants Handled" value="24,800" accentColor="emerald" change="+18% YoY" changeType="positive" icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Avg OR-Tools Solver Run" value="1.38s" accentColor="sky" subtitle="CP-SAT average solve time" icon={<Cpu className="w-4 h-4 text-sky-400" />} />
        <KPICard title="WebSocket Heartbeat" value="24ms" accentColor="violet" subtitle="Global 99th percentile" icon={<Activity className="w-4 h-4 text-violet-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Platform User Growth & Active Evaluators" subtitle="Monthly active participants and judges">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tenantGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="activeUsers" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Events Operated by Tenant Type" subtitle="Distribution across education, enterprise, and agencies">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenantGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                <Bar dataKey="events" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="orgs" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
