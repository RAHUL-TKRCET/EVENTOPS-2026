import { apiRequest } from "./config";

export type InvitableEventRole =
  | "EVENT_ADMIN"
  | "COORDINATOR"
  | "JUDGE"
  | "VOLUNTEER"
  | "PARTICIPANT"
  | "TECHNICAL_STAFF"
  | "RESOURCE_MANAGER";

export interface Invitation {
  id: string;
  email: string;
  role: InvitableEventRole;
  organizationId: string;
  eventId: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
}

export interface CreatedInvitation extends Invitation {
  token: string;
  acceptanceUrl: string | null;
  emailDelivery: "NOT_CONFIGURED";
}

export interface InvitationVerification {
  valid: boolean;
  message: string;
  email?: string | null;
  role?: InvitableEventRole | null;
  organizationName?: string | null;
  eventName?: string | null;
  expiresAt?: string | null;
}

export interface AcceptedInvitation {
  message: string;
  userId: string;
  eventId: string;
  role: InvitableEventRole;
  accountCreated: boolean;
}

export const invitationsApi = {
  list(eventId?: string): Promise<Invitation[]> {
    const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : "";
    return apiRequest<Invitation[]>(`/invitations${query}`);
  },

  create(input: { email: string; role: InvitableEventRole; eventId: string }): Promise<CreatedInvitation> {
    return apiRequest<CreatedInvitation>("/invitations", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  revoke(id: string): Promise<Invitation> {
    return apiRequest<Invitation>(`/invitations/${encodeURIComponent(id)}/revoke`, {
      method: "POST",
    });
  },

  verify(token: string): Promise<InvitationVerification> {
    return apiRequest<InvitationVerification>("/invitations/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  accept(input: { token: string; name?: string; password?: string }): Promise<AcceptedInvitation> {
    return apiRequest<AcceptedInvitation>("/invitations/accept", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
