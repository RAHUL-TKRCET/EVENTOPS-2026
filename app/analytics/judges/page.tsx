"use client";

import React from "react";
import { KPICard, ChartCard } from "@/components/ui/KPICard";
import { mockJudges } from "@/lib/mock-data/judges";
import { Scale, CheckCircle, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const judgeWorkloadChart = mockJudges.slice(0, 10).map((j) => ({
  name: j.id,
  fullName: j.name,
  workload: j.workload,
  assigned: j.assignedTeams.length,
}));

export default function AnalyticsJudgesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">Jury Workload & Rubric Analytics</h2>
        <p className="text-xs text-slate-400">
          Workload dispersion, fatigue metrics, and inter-rater reliability.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Jury Pool" value="20 Judges" subtitle="100% On-Site" icon={<Scale className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Workload Variance (σ)" value="σ = 0.62" accentColor="emerald" subtitle="Balanced by CP-SAT" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Fatigue Threshold Flags" value="2 Judges" accentColor="rose" subtitle="Workload > 85%" icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} />
      </div>

      <ChartCard title="Individual Judge Workload (%)" subtitle="Standardized saturation across evaluators">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={judgeWorkloadChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
              <Bar dataKey="workload" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
