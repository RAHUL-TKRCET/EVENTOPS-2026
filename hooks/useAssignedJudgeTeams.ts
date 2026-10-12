"use client";

import { useEffect, useState } from "react";
import { teamsApi } from "@/lib/api/teams";
import { useAppStore } from "@/store";
import { Team } from "@/types";

interface AssignedTeamsState {
  teams: Team[];
  isLoading: boolean;
  error: string;
}

export function useAssignedJudgeTeams(): AssignedTeamsState & { eventName: string } {
  const { currentRole, currentEvent } = useAppStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setTeams([]);

    if (currentRole !== "JUDGE") {
      setIsLoading(false);
      setError("This workspace is available only to an authenticated judge.");
      return () => {
        cancelled = true;
      };
    }

    if (!currentEvent?.id) {
      setIsLoading(false);
      setError("No active event is selected. Sign in through the event-specific login link to load your assignments.");
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError("");

    teamsApi.getAll(currentEvent.id)
      .then((rows) => {
        if (!cancelled) setTeams(rows);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setTeams([]);
        setError(reason instanceof Error ? reason.message : "Unable to load judge assignments.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentRole, currentEvent?.id]);

  return {
    teams,
    isLoading,
    error,
    eventName: currentEvent?.name || "",
  };
}

export function useAssignedJudgeTeam(teamId: string): {
  team: Team | null;
  isLoading: boolean;
  error: string;
} {
  const { currentRole, currentEvent } = useAppStore();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setTeam(null);

    if (currentRole !== "JUDGE") {
      setIsLoading(false);
      setError("This workspace is available only to an authenticated judge.");
      return () => {
        cancelled = true;
      };
    }

    if (!currentEvent?.id) {
      setIsLoading(false);
      setError("No active event is selected. Sign in through the event-specific login link to open assigned teams.");
      return () => {
        cancelled = true;
      };
    }

    if (!teamId) {
      setIsLoading(false);
      setError("A team identifier is required.");
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError("");

    // The FastAPI endpoint enforces active-event and judge/team assignment scope.
    teamsApi.getById(teamId)
      .then((row) => {
        if (!cancelled) {
          if (row.eventId !== currentEvent.id) {
            setTeam(null);
            setError("This team does not belong to the active event.");
          } else {
            setTeam(row);
          }
        }
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setTeam(null);
        setError(reason instanceof Error ? reason.message : "Unable to load this assigned team.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentRole, currentEvent?.id, teamId]);

  return { team, isLoading, error };
}
