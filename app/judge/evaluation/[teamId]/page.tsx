"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { evaluationApi } from "@/lib/api/evaluation";
import { useAssignedJudgeTeam } from "@/hooks/useAssignedJudgeTeams";
import { useAppStore } from "@/store";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Unlock,
  Save,
} from "lucide-react";

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
  const teamId = String(params.teamId || "");
  const { currentEvent } = useAppStore();
  const { team, isLoading: isTeamLoading, error: teamError } = useAssignedJudgeTeam(teamId);

  const currentRound =
    currentEvent?.rounds?.find((round) => round.order === currentEvent.currentRound) ||
    currentEvent?.rounds?.find((round) => round.status === "IN_PROGRESS" || round.status === "EVALUATING");

  const [criteria, setCriteria] = useState<CriteriaInput[]>([]);
  const [feedback, setFeedback] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingScorecard, setIsLoadingScorecard] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scorecardError, setScorecardError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!team || !currentRound) {
      setCriteria([]);
      setIsLoadingScorecard(false);
      setScorecardError(team ? "No active scoring round is configured for this event." : "");
      return () => {
        cancelled = true;
      };
    }

    const configuredCriteria = currentRound.criteria || [];
    if (configuredCriteria.length === 0) {
      setCriteria([]);
      setIsLoadingScorecard(false);
      setScorecardError("This round has no scoring criteria configured. Scoring is unavailable until the event rubric is set up.");
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingScorecard(true);
    setScorecardError("");
    setSubmitError("");

    const blankCriteria = configuredCriteria.map((item) => ({
      id: item.id,
      name: item.name,
      max: item.maxScore,
      score: 0,
      desc: item.description || "",
    }));
    setCriteria(blankCriteria);

    evaluationApi.getMine(team.id, currentRound.id)
      .then((existing) => {
        if (cancelled) return;
        if (!existing) {
          setFeedback("");
          setStrengths("");
          setImprovements("");
          setIsSubmitted(false);
          setIsLocked(false);
          return;
        }

        setCriteria(configuredCriteria.map((item) => ({
          id: item.id,
          name: item.name,
          max: item.maxScore,
          score: Math.min(item.maxScore, Math.max(0, Number(existing.scores[item.id] ?? 0))),
          desc: item.description || "",
        })));
        setFeedback(existing.feedback || "");
        setStrengths(existing.strengths || "");
        setImprovements(existing.areasToImprove || "");
        setIsSubmitted(existing.status === "SUBMITTED" || existing.status === "LOCKED");
        setIsLocked(existing.status === "LOCKED");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setScorecardError(
          reason instanceof Error
            ? reason.message
            : "Unable to verify your saved scorecard. Scoring has been disabled to avoid overwriting an unknown submission."
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingScorecard(false);
      });

    return () => {
      cancelled = true;
    };
  }, [team?.id, currentRound?.id]);

  const totalScore = criteria.reduce((sum, item) => sum + item.score, 0);
  const maxTotal = criteria.reduce((sum, item) => sum + item.max, 0);

  const updateScore = (id: string, value: number) => {
    if (isLocked) return;
    setCriteria((previous) =>
      previous.map((item) => {
        if (item.id !== id) return item;
        const safeValue = Number.isFinite(value) ? value : 0;
        return { ...item, score: Math.min(item.max, Math.max(0, safeValue)) };
      })
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError("");

    if (!team || !currentEvent || !currentRound) {
      setSubmitError("The active event, team, or scoring round is missing. Re-enter through the event login link.");
      return;
    }
    if (team.eventId !== currentEvent.id) {
      setSubmitError("The selected team does not match the active event. The scorecard was not submitted.");
      return;
    }
    if (criteria.length === 0 || scorecardError || isLoadingScorecard) {
      setSubmitError("The event rubric or saved scorecard could not be verified. The scorecard was not submitted.");
      return;
    }

    setIsSubmitting(true);
    const scores = criteria.reduce((result, item) => {
      result[item.id] = item.score;
      return result;
    }, {} as Record<string, number>);

    try {
      await evaluationApi.submitEvaluation({
        eventId: team.eventId,
        roundId: currentRound.id,
        teamId: team.id,
        scores,
        feedback,
        strengths,
        areasToImprove: improvements,
        status: "SUBMITTED",
      });

      setIsSubmitted(true);
      setIsLocked(true);
      try {
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
      } catch {
        // Confetti is optional; successful API persistence determines submission status.
      }
    } catch (reason: unknown) {
      setSubmitError(
        reason instanceof Error
          ? reason.message
          : "The evaluation could not be saved. Review the error and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTeamLoading) {
    return (
      <div role="status" className="max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-300">
        Verifying team assignment…
      </div>
    );
  }

  if (teamError || !team) {
    return (
      <div className="max-w-4xl mx-auto rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 space-y-3">
        <h1 className="text-lg font-semibold text-rose-200">Evaluation unavailable</h1>
        <p role="alert" className="text-xs leading-relaxed text-rose-100/80">
          {teamError || "The event service did not return this assigned team."}
        </p>
        <Button variant="outline" size="sm" onClick={() => router.push("/judge/teams")}>
          Back to Assigned Teams
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/judge/teams"
            aria-label="Back to assigned teams"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="font-mono text-xs text-amber-400 font-bold uppercase">
              {currentRound?.name || "Scoring Round Not Configured"}
            </span>
            <h1 className="text-xl font-bold font-mono text-white mt-0.5">
              Evaluating: {team.name} ({team.id})
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono block">Rubric Total</span>
            <span className="text-2xl font-black font-mono text-emerald-400">
              {totalScore} / {maxTotal}
            </span>
          </div>
          <button
            type="button"
            disabled={isLoadingScorecard || !!scorecardError}
            onClick={() => setIsLocked((previous) => !previous)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
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

      {isLoadingScorecard && (
        <div role="status" className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-xs text-slate-300">
          Loading the configured rubric and checking for your own saved scorecard…
        </div>
      )}

      {scorecardError && (
        <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-100/90">
          {scorecardError} No sample rubric or other judge's scorecard is shown.
        </div>
      )}

      {submitError && (
        <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-100/90">
          {submitError}
        </div>
      )}

      {isSubmitted && !scorecardError && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold">Your scorecard has been saved for this round.</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => router.push("/judge/teams")}>
            Return to Queue
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-200">Configured Scoring Rubric</h2>

          {!isLoadingScorecard && !scorecardError && criteria.length === 0 && (
            <p className="text-xs text-slate-400">
              No scoring criteria are configured for the current event round. Ask the event administrator to configure the rubric before scoring.
            </p>
          )}

          <div className="space-y-4">
            {criteria.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-100">{item.name}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="font-mono text-sm font-bold text-indigo-400 shrink-0">
                    {item.score} <span className="text-slate-500 font-normal">/ {item.max}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={item.max}
                    disabled={isLocked || isLoadingScorecard || !!scorecardError}
                    value={item.score}
                    aria-label={`${item.name} score`}
                    onChange={(event) => updateScore(item.id, Number(event.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer disabled:opacity-50"
                  />
                  <input
                    type="number"
                    min={0}
                    max={item.max}
                    disabled={isLocked || isLoadingScorecard || !!scorecardError}
                    value={item.score}
                    aria-label={`${item.name} numeric score`}
                    onChange={(event) => updateScore(item.id, Number(event.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-center font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Feedback & Jury Notes</h2>
          <Textarea
            label="Overall Evaluation Notes"
            disabled={isLocked || isLoadingScorecard || !!scorecardError}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Textarea
              label="Key Strengths"
              disabled={isLocked || isLoadingScorecard || !!scorecardError}
              value={strengths}
              onChange={(event) => setStrengths(event.target.value)}
            />
            <Textarea
              label="Areas for Improvement"
              disabled={isLocked || isLoadingScorecard || !!scorecardError}
              value={improvements}
              onChange={(event) => setImprovements(event.target.value)}
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/judge/teams")}>
            Back to Queue
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isLocked || isLoadingScorecard || !!scorecardError || criteria.length === 0}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isSubmitted ? "Update Evaluation" : "Save Evaluation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
