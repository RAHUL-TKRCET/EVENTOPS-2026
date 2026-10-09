import { Organization } from "@/types";
import { createFallbackArray, defaultOrganization } from "./fallbacks";

export const mockOrganizations: Organization[] = createFallbackArray<Organization>([], defaultOrganization);
export const mockInvitations: any[] = [];
