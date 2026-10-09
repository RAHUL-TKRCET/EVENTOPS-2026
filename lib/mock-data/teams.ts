import { Team } from "@/types";
import { createFallbackArray, defaultTeam } from "./fallbacks";

export const mockTeams: Team[] = createFallbackArray<Team>([], defaultTeam);
