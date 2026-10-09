import { Volunteer, VolunteerTask } from "@/types";
import { createFallbackArray, defaultVolunteer } from "./fallbacks";

export const mockVolunteers: Volunteer[] = createFallbackArray<Volunteer>([], defaultVolunteer);
export const mockVolunteerTasks: VolunteerTask[] = [];
