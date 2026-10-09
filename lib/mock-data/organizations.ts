import { Organization } from "@/types";
import { createFallbackArray, defaultOrganization } from "./fallbacks";

export const mockOrganizations: Organization[] = createFallbackArray<Organization>([], defaultOrganization);
export const mockInvitations: any[] = [];

export interface OrganizationInvitation {
  id: string;
  code: string;
  organizationId: string;
  organizationName: string;
  organizationType?: string;
  subtype?: string;
  role: string;
  invitedRole?: string;
  invitedBy?: string;
  inviterName: string;
  inviterEmail: string;
  expiresAt: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
}
