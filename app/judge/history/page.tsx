"use client";

import React from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { mockEvaluations } from "@/lib/mock-data/evaluations";
import { mockTeams } from "@/lib/mock-data/teams";
import { EvaluationItem } from "@/types";
import { ArrowLeft, Scale, Award } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function JudgeHistoryPage() {
  const router = useRouter();

  const columns: Column<EvaluationItem>[] = [
    {
      key: "teamId",
      header: "Team ID",
      sortable: true,
      className: "w-24 font-mono font-bold text-indigo-400",
    },
    {
      key: "teamName",
      header: "Team Name",
      render: (e) => {
        const team = mockTeams.find((t) => t.id === e.teamId);
        return <span className="font-semibold text-slate-100">{team?.name || e.teamId}</span>;
      },
    },
    {
      key: "totalScore",
      header: "Final Score",
      sortable: true,
      render: (e) => (
        <span className="font-mono font-bold text-sm text-emerald-400">{e.totalScore} / 100</span>
      ),
    },
    {
      key: "feedback",
      header: "Feedback Summary",
      render: (e) => <span className="text-xs text-slate-300 line-clamp-1">{e.feedback}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (e) => <StatusBadge status={e.status} />,
    },
    {
      key: "submittedAt",
      header: "Submitted",
      render: (e) => (
        <span className="font-mono text-xs text-slate-400">
          {e.submittedAt ? new Date(e.submittedAt).toLocaleTimeString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/judge/teams"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Evaluation Audit History</h2>
          <p className="text-xs text-slate-400">Archived rubric score submissions and lock logs.</p>
        </div>
      </div>

      <DataTable
        data={mockEvaluations}
        columns={columns}
        keyExtractor={(e) => e.id}
        searchPlaceholder="Filter past evaluations..."
        onRowClick={(e) => router.push(`/judge/evaluation/${e.teamId}`)}
      />
    </div>
  );
}
