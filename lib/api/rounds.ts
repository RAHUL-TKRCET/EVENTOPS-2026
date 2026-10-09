import { EventRound, Team } from "@/types";
import { mockEvents } from "@/lib/mock-data/events";
import { mockTeams } from "@/lib/mock-data/teams";

export const roundsApi = {
  async getRounds(eventId = "evt-01"): Promise<EventRound[]> {
    await new Promise((r) => setTimeout(r, 150));
    const event = mockEvents.find((e) => e.id === eventId);
    return event ? event.rounds : [];
  },

  async advanceTeams(roundId: string, qualifyingCount = 48): Promise<{ advancedTeams: Team[]; nextRound: number }> {
    await new Promise((r) => setTimeout(r, 350));
    // Sort teams by totalScore desc
    const sorted = [...mockTeams].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    const qualified = sorted.slice(0, qualifyingCount);

    qualified.forEach((t) => {
      t.currentRound = 2;
    });

    const event = mockEvents.find((e) => e.id === "evt-01");
    if (event) {
      event.currentRound = 2;
    }

    return {
      advancedTeams: qualified,
      nextRound: 2,
    };
  },

  async getLeaderboard(eventId = "evt-01", roundOrder = 1): Promise<Team[]> {
    await new Promise((r) => setTimeout(r, 150));
    return [...mockTeams]
      .filter((t) => t.eventId === eventId)
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .map((t, idx) => ({ ...t, rank: idx + 1 }));
  },
};
