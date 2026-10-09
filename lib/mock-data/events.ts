import { EventItem } from "@/types";
import { createFallbackArray, defaultEvent } from "./fallbacks";

export const mockEvents: EventItem[] = createFallbackArray<EventItem>([], defaultEvent);
export const mockPersonalEvents: EventItem[] = [];
