"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { roundsApi } from "@/lib/api/rounds";
import confetti from "canvas-confetti";
import { Trophy, ArrowLeft, CheckCircle2, ArrowRight, Sparkles, Layers } from "lucide-react";
import Link from "next/link";

export default function RoundAdvancementPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = (params.roundId as string) || "rnd-01";
  const [qualifyingCap, setQualifyingCap] = useState("48");
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);

  const handleAdvance = async () => {
    setIsAdvancing(true);
    await roundsApi.advanceTeams(roundId, parseInt(qualifyingCap, 10) || 48);
    setIsAdvancing(false);
    setIsAdvanced(true);

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch (_) {}
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/rounds/${roundId}/ranking`}
          className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="font-mono text-xs text-indigo-400 font-bold uppercase">
            Tournament Cutoff & Promotion
          </span>
          <h2 className="text-xl font-bold font-mono text-white mt-0.5">
            Advance Teams to Round 2
          </h2>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Round 1 → Round 2 Advancement Protocol
            </h3>
            <p className="text-xs text-slate-400">
              Only the top-ranked teams within the qualifying threshold will be promoted.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 text-xs">
          <label className="block text-slate-300 font-medium">Advancement Quota</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={qualifyingCap}
              onChange={(e) => setQualifyingCap(e.target.value)}
              className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-slate-400">
              Top <span className="font-bold text-emerald-400">{qualifyingCap} teams</span> promote to Round 2 Deep-Dive Prototype Demo
            </span>
          </div>
        </div>

        {isAdvanced && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 space-y-2 text-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>48 Teams Successfully Promoted to Round 2!</span>
            </div>
            <p className="text-emerald-300/80">
              Next round allocation schedules & bench assignments are ready for OR-Tools re-balancing.
            </p>
          </div>
        )}

        <div className="pt-4 flex items-center justify-between border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/rounds/${roundId}/ranking`)}
          >
            Review Ranking Table
          </Button>

          <Button
            type="button"
            variant={isAdvanced ? "success" : "primary"}
            size="lg"
            isLoading={isAdvancing}
            disabled={isAdvanced}
            onClick={handleAdvance}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isAdvanced ? "Advancement Complete ✓" : "Confirm & Advance Qualified Teams"}
          </Button>
        </div>
      </div>
    </div>
  );
}
