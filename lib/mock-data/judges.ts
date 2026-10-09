import { Judge } from "@/types";
import { createFallbackArray, defaultJudge } from "./fallbacks";

export const mockJudges: Judge[] = createFallbackArray<Judge>([], defaultJudge);
