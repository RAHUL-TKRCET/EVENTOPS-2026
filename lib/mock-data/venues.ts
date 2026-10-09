import { Venue } from "@/types";
import { createFallbackArray, defaultVenue } from "./fallbacks";

export const mockVenues: Venue[] = createFallbackArray<Venue>([], defaultVenue);
