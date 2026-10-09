import { Incident } from "@/types";
import { createFallbackArray, defaultIncident } from "./fallbacks";

export const mockIncidents: Incident[] = createFallbackArray<Incident>([], defaultIncident);
