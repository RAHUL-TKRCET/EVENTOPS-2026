"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { mockTeams } from "@/lib/mock-data/teams";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { evaluationApi } from "@/lib/api/evaluation";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldCheck,
  Award,
  Sparkles,
  Save,
} from "lucide-react";
import Link from "next/link";

interface CriteriaInput {
  id: string;
  name: string;
  max: number;
  score: number;
  desc: string;
}

export default function JudgeEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const team = mockTeams.find((t) => t.id === teamId) || mockTeams[0];

  const [criteria, setCriteria] = useState<CriteriaInput[]>([
    { id: "c1", name: "Novelty & Innovation", max: 20, score: 19, desc: "Originality of conceptual architecture and uniqueness" },
    { id: "c2", name: "Technical Implementation", max: 25, score: 24, desc: "Code quality, latency optimization, distributed resilience" },
    { id: "c3", name: "Impact & Market Viability", max: 20, score: 19, desc: "Real-world utility and addressable enterprise opportunity" },
    { id: "c4", name: "Presentation & Defense", max: 15, score: 14, desc: "Clarity of communication, response to technical scrutiny" },
    { id: "c5", name: "Feasibility & Deployability", max: 10, score: 10, desc: "Realistic engineering timeline and compliance readiness" },
    { id: "c6", name: "Overall Quality & Polish", max: 10, score: 10, desc: "End-to-end user ergonomics and finish" },
  ]);

  const [feedback, setFeedback] = useState("Outstanding technical execution. The multi-modal quantization pipeline provides impressive inference latency.");
  const [strengths, setStrengths] = useState("Sub-10ms response times and clear zero-trust architectural boundaries.");
  const [improvements, setImprovements] = useState("Prepare detailed data privacy compliance documentation for hospital pilots.");
  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);

  const updateScore = (id: string, val: number) => {
    if (isLocked) return;
    setCriteria((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const clamped = Math.min(c.max, Math.max(0, val));
          return { ...c, score: clamped };
        }
        return c;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const scoresMap = criteria.reduce((acc, c) => {
      acc[c.id] = c.score;
      return acc;
    }, {} as Record<string, number>);

    await evaluationApi.submitEvaluation({
      teamId: team.id,
      scores: scoresMap,
      feedback,
      strengths,
      areasToImprove: improvements,
    });

    setIsSubmitting(false);
    setIsSubmitted(true);
    setIsLocked(true);

    // Fire celebration confetti
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (_) {}
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/judge/teams"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="font-mono text-xs text-amber-400 font-bold uppercase">
              Digital Scoring Rubric — Round 1
            </span>
            <h2 className="text-xl font-bold font-mono text-white mt-0.5">
              Evaluating: {team.name} ({team.id})
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono block">Aggregate Score</span>
            <span className="text-2xl font-black font-mono text-emerald-400">{totalScore} / 100</span>
          </div>

          <button
            type="button"
            onClick={() => setIsLocked(!isLocked)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition cursor-pointer ${
              isLocked
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span>{isLocked ? "Locked" : "Editable"}</span>
          </button>
        </div>
      </div>

      {isSubmitted && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center justify-between text-xs animate-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold">Rubric Evaluation Recorded & Synced to Master Leaderboard</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => router.push("/judge/teams")}>
            Return to Team Queue
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rubric Criteria Sliders */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-5">
          <h3 className="text-sm font-semibold text-slate-200">Standardized Scoring Rubric</h3>

          <div className="space-y-4">
            {criteria.map((c) => (
              <div key={c.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-100">{c.name}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{c.desc}</p>
                  </div>
                  <div className="font-mono text-sm font-bold text-indigo-400">
                    {c.score} <span className="text-slate-500 font-normal">/ {c.max}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={c.max}
                    disabled={isLocked}
                    value={c.score}
                    onChange={(e) => updateScore(c.id, parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500 cursor-pointer disabled:opacity-50"
                  />
                  <input
                    type="number"
                    min={0}
                    max={c.max}
                    disabled={isLocked}
                    value={c.score}
                    onChange={(e) => updateScore(c.id, parseInt(e.target.value, 10))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-center font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Qualitative Feedback */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Qualitative Feedback & Jury Notes</h3>
          <Textarea
            label="Overall Evaluation Notes"
            disabled={isLocked}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Textarea
              label="Key Technical Strengths"
              disabled={isLocked}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
            />
            <Textarea
              label="Areas for Round 2 Improvement"
              disabled={isLocked}
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/judge/teams")}
          >
            Back to Queue
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isLocked && isSubmitted}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isSubmitted ? "Update Evaluation" : "Finalize & Submit Evaluation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
