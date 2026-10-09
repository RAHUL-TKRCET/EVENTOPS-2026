"use client";

import React from "react";
import { KPICard, ChartCard } from "@/components/ui/KPICard";
import { Trophy, CheckCircle, Award } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const scoreDistribution = [
  { range: "90-100 pts", teams: 18 },
  { range: "80-89 pts", teams: 52 },
  { range: "70-79 pts", teams: 36 },
  { range: "< 70 pts", teams: 14 },
];

export default function AnalyticsEvaluationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">Evaluation & Rubric Scoring Telemetry</h2>
        <p className="text-xs text-slate-400">
          Score dispersion, jury rubric consistency, and normalization across panels.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Mean Score" value="82.4 / 100" subtitle="Round 1 Screening" icon={<Trophy className="w-4 h-4 text-indigo-400" />} />
        <KPICard title="Highest Score" value="98 / 100" accentColor="emerald" subtitle="Team T042 (BioSense)" icon={<Award className="w-4 h-4 text-emerald-400" />} />
        <KPICard title="Evaluation Speed" value="11.4 mins" accentColor="sky" subtitle="Avg Rubric Pitch Length" icon={<CheckCircle className="w-4 h-4 text-sky-400" />} />
      </div>

      <ChartCard title="Team Score Distribution Histogram" subtitle="Number of teams per score bracket">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
              <Bar dataKey="teams" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
