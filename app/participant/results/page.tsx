"use client";

import React from "react";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/Badge";
import { Trophy, Medal, Award, CheckCircle2, Star, Sparkles } from "lucide-react";

export default function ParticipantResultsPage() {
  const publishedRankings = [
    { rank: 1, teamId: "T042", teamName: "BioSense: Glucose Predictor", score: 96.5, qualified: true, medal: "🥇 Gold" },
    { rank: 2, teamId: "T001", teamName: "NeuralPulse: Edge-Compute", score: 95.0, qualified: true, medal: "🥈 Silver" },
    { rank: 3, teamId: "T018", teamName: "VoltGuard: Micro-Grid Balancer", score: 93.8, qualified: true, medal: "🥉 Bronze" },
    { rank: 4, teamId: "T022", teamName: "OmniFlow: Stream Processor", score: 92.0, qualified: true },
    { rank: 5, teamId: "T009", teamName: "Sentrix: Threat Neutralizer", score: 91.2, qualified: true },
    { rank: 6, teamId: "T034", teamName: "AgriDrone: Disease Identifier", score: 89.5, qualified: true },
    { rank: 7, teamId: "T055", teamName: "CodeWeaver: Semantic Compiler", score: 88.0, qualified: true },
    { rank: 8, teamId: "T011", teamName: "AeroMesh: Drone Mesh", score: 87.4, qualified: true },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-pink-400 uppercase">
            Official Standings
          </span>
          <StatusBadge status="PUBLISHED" />
        </div>
        <h1 className="text-xl font-bold font-mono text-white mt-1">
          Round 1 Published Results & Advancements
        </h1>
        <p className="text-xs text-slate-400">
          Validated and released by the Jury Panel and Operations Director
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Team T042 Standing"
          value="Rank #1"
          subtitle="Top 1% of 120 Teams"
          accentColor="emerald"
          icon={<Trophy className="w-4 h-4 text-emerald-400" />}
        />
        <KPICard
          title="Aggregated Score"
          value="96.5 / 100"
          subtitle="Jury Consensus"
          accentColor="sky"
          icon={<Star className="w-4 h-4 text-sky-400" />}
        />
        <KPICard
          title="Round 2 Advancement"
          value="QUALIFIED"
          subtitle="Top 20 Threshold Met"
          accentColor="violet"
          icon={<CheckCircle2 className="w-4 h-4 text-purple-400" />}
        />
      </div>

      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 space-y-4">
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          Top Advancing Teams Leaderboard
        </h3>

        <div className="divide-y divide-slate-800">
          {publishedRankings.map((r) => {
            const isMyTeam = r.teamId === "T042";

            return (
              <div
                key={r.teamId}
                className={`py-3.5 px-4 rounded-xl flex items-center justify-between transition ${
                  isMyTeam ? "bg-indigo-600/15 border border-indigo-500/30" : "hover:bg-slate-950/40"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-sm w-8 text-center text-slate-400">
                    {r.medal ? r.medal.split(" ")[0] : `#${r.rank}`}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400">{r.teamId}</span>
                      <span className={`text-xs font-semibold ${isMyTeam ? "text-indigo-300" : "text-slate-100"}`}>
                        {r.teamName}
                      </span>
                      {isMyTeam && (
                        <span className="text-[9px] font-mono uppercase bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                          My Team
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-bold text-emerald-400">{r.score}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    ADVANCED
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
