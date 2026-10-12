"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Badge";
import { evaluationApi } from "@/lib/api/evaluation";
import { EvaluationItem } from "@/types";
import { ArrowLeft, ClipboardList, Scale } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/store";

type JudgeEvaluationRow = EvaluationItem & { teamName?: string | null };

export default function JudgeHistoryPage() {
  const { currentRole, currentEvent } = useAppStore();
  const [evaluations, setEvaluations] = useState<JudgeEvaluationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setEvaluations([]);

    if (currentRole !== "JUDGE") {
      setIsLoading(false);
      setError("Evaluation history is only available to an authenticated judge.");
      return () => {
        cancelled = true;
      };
    }

    if (!currentEvent?.id) {
      setIsLoading(false);
      setError("No active event is selected. Sign in through the event-specific login link to load your history.");
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError("");

    evaluationApi.getMineForEvent(currentEvent.id)
      .then((rows) => {
        if (!cancelled) setEvaluations(rows);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setEvaluations([]);
        setError(reason instanceof Error ? reason.message : "Unable to load your evaluation history.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentRole, currentEvent?.id]);

  const columns = useMemo<Column<JudgeEvaluationRow>[]>(() => [
    {
      key: "teamId",
      header: "Team ID",
      sortable: true,
      className: "w-24 font-mono font-bold text-indigo-400",
    },
    {
      key: "teamName",
      header: "Team Name",
      render: (item) => <span className="font-semibold text-slate-100">{item.teamName || item.teamId}</span>,
    },
    {
      key: "totalScore",
      header: "Your Score",
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-sm text-emerald-400">{item.totalScore}</span>
      ),
    },
    {
      key: "feedback",
      header: "Feedback Summary",
      render: (item) => <span className="text-xs text-slate-300 line-clamp-1">{item.feedback || "No feedback recorded"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "submittedAt",
      header: "Submitted",
      render: (item) => (
        <span className="font-mono text-xs text-slate-400">
          {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "—"}
        </span>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/judge/teams"
          aria-label="Back to assigned teams"
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold font-mono text-white">My Evaluation History</h1>
          <p className="text-xs text-slate-400">
            {currentEvent?.name || "No event selected"} • Only scorecards submitted by your judge account are shown.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex items-center gap-3">
          <Scale className="w-5 h-5 text-indigo-400" />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Your submissions</p>
            <p className="text-2xl font-mono font-bold text-white">{evaluations.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Saved from event API</p>
            <p className="text-sm font-semibold text-white">{isLoading ? "Loading…" : "Verified response"}</p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div role="status" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
          Loading your saved evaluation history…
        </div>
      )}

      {!isLoading && error && (
        <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 space-y-2">
          <h2 className="text-sm font-semibold text-rose-200">History unavailable</h2>
          <p className="text-xs leading-relaxed text-rose-100/80">{error}</p>
          <p className="text-xs text-slate-400">No mock scorecards are used as fallback.</p>
        </div>
      )}

      {!isLoading && !error && evaluations.length === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center space-y-2">
          <ClipboardList className="w-8 h-8 text-slate-500 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-200">No saved evaluations yet</h2>
          <p className="text-xs text-slate-400">When you submit a rubric for an assigned team, it will appear here.</p>
        </div>
      )}

      {!isLoading && !error && evaluations.length > 0 && (
        <DataTable
          data={evaluations}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Filter your evaluation history…"
        />
      )}
    </div>
  );
}
