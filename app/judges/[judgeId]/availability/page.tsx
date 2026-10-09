"use client";

import React from "react";
import { useParams } from "next/navigation";
import { mockJudges } from "@/lib/mock-data/judges";
import { ArrowLeft, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function JudgeAvailabilityPage() {
  const params = useParams();
  const judgeId = params.judgeId as string;
  const judge = mockJudges.find((j) => j.id === judgeId) || mockJudges[0];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/judges/${judge.id}`}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold font-mono text-white">Availability Matrix: {judge.name}</h2>
          <p className="text-xs text-slate-400">Time window slots and physical presence schedule.</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="space-y-3">
          {(judge?.availableSlots || []).map((slot, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-slate-200">{slot}</span>
              </div>
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                <CheckCircle className="w-3.5 h-3.5" /> Confirmed Available
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
