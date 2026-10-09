"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { mockTeams } from "@/lib/mock-data/teams";
import { Team } from "@/types";
import { Trophy, ArrowLeft, ArrowRight, Award, Sparkles } from "lucide-react";
import Link from "next/link";

export default function RoundRankingPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = (params.roundId as string) || "rnd-01";

  // Sort teams by totalScore desc
  const sortedTeams = [...mockTeams].sort(
    (a, b) => (b.totalScore || 0) - (a.totalScore || 0)
  );

  const columns: Column<Team>[] = [
    {
      key: "rank",
      header: "Rank",
      className: "w-16 font-mono font-bold text-center",
      render: (t) => {
        const rank = sortedTeams.indexOf(t) + 1;
        return (
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-mono font-bold ${
              rank === 1
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : rank === 2
                ? "bg-slate-300/20 text-slate-200 border border-slate-300/40"
                : rank === 3
                ? "bg-amber-700/20 text-amber-500 border border-amber-700/40"
                : "text-slate-400"
            }`}
          >
            {rank}
          </span>
        );
      },
    },
    {
      key: "id",
      header: "Team ID",
      sortable: true,
      className: "w-24 font-mono font-bold text-indigo-400",
    },
    {
      key: "name",
      header: "Team Name & Track",
      sortable: true,
      render: (t) => (
        <div>
          <div className="font-semibold text-slate-100">{t.name}</div>
          <div className="text-[11px] text-slate-500 font-mono">{t.project.domain}</div>
        </div>
      ),
    },
    {
      key: "totalScore",
      header: "Jury Score",
      sortable: true,
      render: (t) => (
        <span className="font-mono font-bold text-sm text-emerald-400">
          {t.totalScore || 70} <span className="text-slate-500 text-xs font-normal">/ 100</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Qualification Status",
      render: (t) => {
        const rank = sortedTeams.indexOf(t) + 1;
        const isQualified = rank <= 48;
        return isQualified ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Qualified (Top 48)
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-500">
            Cutoff Standby
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Inspect",
      render: (t) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/teams/${t.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/rounds"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-amber-400 font-bold uppercase">Round 1</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
                Qualifying Cutoff: Rank 1 - 48
              </span>
            </div>
            <h2 className="text-xl font-bold font-mono text-white mt-0.5">
              Live Tournament Leaderboard
            </h2>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => router.push(`/rounds/${roundId}/advancement`)}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Advance Qualified Teams →
        </Button>
      </div>

      <DataTable
        data={sortedTeams}
        columns={columns}
        keyExtractor={(t) => t.id}
        searchPlaceholder="Search leaderboard by team or track..."
        searchFilter={(t, q) =>
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.project.domain.toLowerCase().includes(q)
        }
      />
    </div>
  );
}
