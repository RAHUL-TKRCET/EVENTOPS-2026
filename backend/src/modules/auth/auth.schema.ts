import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  role: z.enum([
    "SUPER_ADMIN",
    "ORGANIZATION_ADMIN",
    "EVENT_ADMIN",
    "COORDINATOR",
    "JUDGE",
    "VOLUNTEER",
    "PARTICIPANT",
    "TECHNICAL_STAFF",
    "RESOURCE_MANAGER",
  ]).optional(),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([
    "SUPER_ADMIN",
    "ORGANIZATION_ADMIN",
    "EVENT_ADMIN",
    "COORDINATOR",
    "JUDGE",
    "VOLUNTEER",
    "PARTICIPANT",
    "TECHNICAL_STAFF",
    "RESOURCE_MANAGER",
  ]).default("PARTICIPANT"),
  organizationId: z.string().optional(),
});

export const SwitchRoleSchema = z.object({
  targetRole: z.enum([
    "SUPER_ADMIN",
    "ORGANIZATION_ADMIN",
    "EVENT_ADMIN",
    "COORDINATOR",
    "JUDGE",
    "VOLUNTEER",
    "PARTICIPANT",
    "TECHNICAL_STAFF",
    "RESOURCE_MANAGER",
  ]),
});

export const VerifyInviteSchema = z.object({
  inviteCode: z.string().min(4, "Invite code required"),
});
