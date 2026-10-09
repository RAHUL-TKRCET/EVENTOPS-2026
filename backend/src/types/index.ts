export type UserRole =
  | "SUPER_ADMIN"
  | "ORGANIZATION_ADMIN"
  | "EVENT_ADMIN"
  | "COORDINATOR"
  | "JUDGE"
  | "VOLUNTEER"
  | "PARTICIPANT"
  | "TECHNICAL_STAFF"
  | "RESOURCE_MANAGER";

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  activeEventId?: string | null;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  iat?: number;
  exp?: number;
}

export interface CryptographicQRPayload {
  teamId: string;
  memberId?: string;
  eventId: string;
  role: "PARTICIPANT" | "VOLUNTEER" | "JUDGE" | "ORGANIZER";
  issuedAt: number;
  expiresAt: number;
  nonce: string;
}

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "UPCOMING"
  | "LIVE"
  | "PAUSED"
  | "COMPLETED"
  | "ARCHIVED";

export type CheckInStatus =
  | "CHECKED_IN"
  | "NOT_CHECKED_IN"
  | "PARTIAL"
  | "ABSENT";

export interface HardConstraint {
  id: string;
  name: string;
  description: string;
  category: "CAPACITY" | "CONFLICT" | "TECHNICAL" | "TIMING";
  enabled: boolean;
  isCustom?: boolean;
}

export interface SoftConstraint {
  id: string;
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
  isCustom?: boolean;
}

export interface AllocationSolveRequest {
  eventId: string;
  roundId: string;
  hardConstraints: HardConstraint[];
  softConstraints: SoftConstraint[];
  solverTimeoutSeconds?: number;
}

