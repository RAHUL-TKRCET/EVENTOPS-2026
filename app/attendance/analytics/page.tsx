"use client";

import React from "react";
import { KPICard, ChartCard } from "@/components/ui/KPICard";
import { Users, CheckCircle, Clock, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const hourlyArrivals = [
  { hour: "08:00 AM", teams: 18 },
  { hour: "08:30 AM", teams: 30 },
  { hour: "09:00 AM", teams: 28 },
  { hour: "09:30 AM", teams: 16 },
  { hour: "10:00 AM", teams: 12 },
  { hour: "10:30 AM", teams: 6 },
  { hour: "11:00 AM", teams: 4 },
];

const attendancePie = [
  { name: "Checked In", value: 114, color: "#10b981" },
  { name: "Absent / Pending", value: 6, color: "#ef4444" },
];

export default function AttendanceAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">Attendance Telemetry & Analytics</h2>
        <p className="text-xs text-slate-400">
          Turnstile throughput curves, peak ingress velocity, and bench occupancy conversion.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard title="Total Roster" value="120" subtitle="Expected Teams" icon={<Users className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Present Rate" value="95%" accentColor="emerald" change="+12% vs last year" changeType="positive" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Peak Arrival Hour" value="08:30 AM" subtitle="30 teams in 30 mins" accentColor="sky" icon={<Clock className="w-4 h-4 text-sky-400" />} />
        <KPICard title="Avg Scan Latency" value="280ms" accentColor="violet" subtitle="QR verification SLA" icon={<TrendingUp className="w-4 h-4 text-violet-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Ingress Velocity by Time Bucket" subtitle="Teams verified through turnstiles per 30-minute block">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyArrivals}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                <Bar dataKey="teams" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Overall Presence Ratio" subtitle="Checked-in vs Absent teams">
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attendancePie} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {attendancePie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
