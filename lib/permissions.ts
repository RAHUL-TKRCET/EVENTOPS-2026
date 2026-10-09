import { UserRole } from "@/types";

export type Permission =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "assign"
  | "approve"
  | "export"
  | "manage"
  | "scan_qr"
  | "evaluate"
  | "run_optimization";

export interface RoleConfig {
  role: UserRole;
  label: string;
  portalPath: string;
  description: string;
  badge: string;
  color: string;
  canScanQr: boolean;
  canRunOptimization: boolean;
  canManageOrg: boolean;
  canManageJudges: boolean;
  canManageVolunteers: boolean;
  canManageResources: boolean;
  canManageAttendance: boolean;
  canEvaluateTeams: boolean;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  SUPER_ADMIN: {
    role: "SUPER_ADMIN",
    label: "Super Admin",
    portalPath: "/super-admin",
    description: "Platform-wide governance and multi-tenant management",
    badge: "Platform Owner",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    canScanQr: true,
    canRunOptimization: true,
    canManageOrg: true,
    canManageJudges: true,
    canManageVolunteers: true,
    canManageResources: true,
    canManageAttendance: true,
    canEvaluateTeams: false,
  },
  ORGANIZATION_ADMIN: {
    role: "ORGANIZATION_ADMIN",
    label: "Organization Admin",
    portalPath: "/dashboard",
    description: "Multi-event management, members, settings, and full tenant operations",
    badge: "Tenant Lead",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    canScanQr: true,
    canRunOptimization: true,
    canManageOrg: true,
    canManageJudges: true,
    canManageVolunteers: true,
    canManageResources: true,
    canManageAttendance: true,
    canEvaluateTeams: false,
  },
  EVENT_ADMIN: {
    role: "EVENT_ADMIN",
    label: "Event Admin",
    portalPath: "/dashboard",
    description: "End-to-end event operations, scheduling, teams, and oversight",
    badge: "Director of Ops",
    color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
    canScanQr: true,
    canRunOptimization: true,
    canManageOrg: false,
    canManageJudges: true,
    canManageVolunteers: true,
    canManageResources: true,
    canManageAttendance: true,
    canEvaluateTeams: false,
  },
  COORDINATOR: {
    role: "COORDINATOR",
    label: "Coordinator",
    portalPath: "/dashboard",
    description: "Live floor management, attendance monitoring, and rapid resolution",
    badge: "Floor Lead",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    canScanQr: true,
    canRunOptimization: false,
    canManageOrg: false,
    canManageJudges: false,
    canManageVolunteers: true,
    canManageResources: true,
    canManageAttendance: true,
    canEvaluateTeams: false,
  },
  JUDGE: {
    role: "JUDGE",
    label: "Judge / Evaluator",
    portalPath: "/judge",
    description: "Assigned team reviews, scoring rubrics, and feedback submission",
    badge: "Jury Panel",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    canScanQr: true, // Only for verifying assigned teams!
    canRunOptimization: false,
    canManageOrg: false,
    canManageJudges: false,
    canManageVolunteers: false,
    canManageResources: false,
    canManageAttendance: false,
    canEvaluateTeams: true,
  },
  VOLUNTEER: {
    role: "VOLUNTEER",
    label: "Volunteer",
    portalPath: "/volunteers",
    description: "Shift assignments, task execution, zone check-in, and incident escalation",
    badge: "Field Ops",
    color: "text-teal-400 bg-teal-500/10 border-teal-500/30",
    canScanQr: true, // Check-in scanner
    canRunOptimization: false,
    canManageOrg: false,
    canManageJudges: false,
    canManageVolunteers: false,
    canManageResources: false,
    canManageAttendance: false,
    canEvaluateTeams: false,
  },
  PARTICIPANT: {
    role: "PARTICIPANT",
    label: "Participant / Student",
    portalPath: "/participant",
    description: "Team badge, project info, schedule, venue allocation, and live results",
    badge: "Hacker / Student",
    color: "text-pink-400 bg-pink-500/10 border-pink-500/30",
    canScanQr: false, // PARTICIPANT CANNOT SCAN QR CODES!
    canRunOptimization: false,
    canManageOrg: false,
    canManageJudges: false,
    canManageVolunteers: false,
    canManageResources: false,
    canManageAttendance: false,
    canEvaluateTeams: false,
  },
  TECHNICAL_STAFF: {
    role: "TECHNICAL_STAFF",
    label: "Technical Staff",
    portalPath: "/technical-staff",
    description: "Hardware, power, networking, audio-visual, and room readiness",
    badge: "NetOps & Power",
    color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    canScanQr: true, // Equipment / room verification
    canRunOptimization: false,
    canManageOrg: false,
    canManageJudges: false,
    canManageVolunteers: false,
    canManageResources: false,
    canManageAttendance: false,
    canEvaluateTeams: false,
  },
  RESOURCE_MANAGER: {
    role: "RESOURCE_MANAGER",
    label: "Resource Manager",
    portalPath: "/resource-manager",
    description: "Meals, merchandise, swag kits, equipment inventory, and badges",
    badge: "Catering & Kits",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    canScanQr: true, // Distribution verification
    canRunOptimization: false,
    canManageOrg: false,
    canManageJudges: false,
    canManageVolunteers: false,
    canManageResources: true,
    canManageAttendance: false,
    canEvaluateTeams: false,
  },
};

/**
 * Route protection rules: maps route path prefix to allowed roles.
 */
export const ROUTE_ACCESS_RULES: { prefix: string; allowedRoles: UserRole[]; exact?: boolean }[] = [
  // Super Admin only
  {
    prefix: "/super-admin",
    allowedRoles: ["SUPER_ADMIN"],
  },
  // Judge Portal
  {
    prefix: "/judge",
    allowedRoles: ["JUDGE", "EVENT_ADMIN", "ORGANIZATION_ADMIN", "SUPER_ADMIN"],
  },
  // Participant Portal
  {
    prefix: "/participant",
    allowedRoles: ["PARTICIPANT", "EVENT_ADMIN", "ORGANIZATION_ADMIN", "SUPER_ADMIN"],
  },
  // Technical Staff Portal
  {
    prefix: "/technical-staff",
    allowedRoles: ["TECHNICAL_STAFF", "EVENT_ADMIN", "COORDINATOR", "ORGANIZATION_ADMIN", "SUPER_ADMIN"],
  },
  // Resource Manager Portal
  {
    prefix: "/resource-manager",
    allowedRoles: ["RESOURCE_MANAGER", "EVENT_ADMIN", "COORDINATOR", "ORGANIZATION_ADMIN", "SUPER_ADMIN"],
  },
  // Scanner is strictly forbidden for Participant
  {
    prefix: "/attendance/scanner",
    allowedRoles: [
      "SUPER_ADMIN",
      "ORGANIZATION_ADMIN",
      "EVENT_ADMIN",
      "COORDINATOR",
      "JUDGE",
      "VOLUNTEER",
      "TECHNICAL_STAFF",
      "RESOURCE_MANAGER",
    ],
  },
  // Attendance Registry & Management
  {
    prefix: "/attendance",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR"],
  },
  // Optimization execution & constraints
  {
    prefix: "/allocation/optimization",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"],
  },
  {
    prefix: "/allocation/constraints",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"],
  },
  {
    prefix: "/allocation/requirements",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"],
  },
  {
    prefix: "/allocation",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR"],
  },
  // Control center
  {
    prefix: "/control-center",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR"],
  },
  // Global admin settings
  {
    prefix: "/settings/organization",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN"],
  },
  {
    prefix: "/settings/roles",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"],
  },
  {
    prefix: "/settings/security",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"],
  },
  {
    prefix: "/settings/integrations",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"],
  },
  // Rounds management
  {
    prefix: "/rounds/create",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"],
  },
  // Judge management
  {
    prefix: "/judges/create",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"],
  },
  {
    prefix: "/judges",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR"],
  },
  // Team creation & management
  {
    prefix: "/teams/register",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR"],
  },
  // Event creation
  {
    prefix: "/events/create",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN"],
  },
  // Volunteers management
  {
    prefix: "/volunteers/create",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR"],
  },
  // Communication dispatch
  {
    prefix: "/communication/create",
    allowedRoles: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR"],
  },
];

/**
 * Checks whether a given role is authorized to access a given URL path.
 */
export function checkRouteAccess(role: UserRole, pathname: string): { authorized: boolean; allowedRoles?: UserRole[] } {
  // Public / Open Workspace routes always allowed
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-otp") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/organizations") ||
    pathname.startsWith("/personal-events")
  ) {
    return { authorized: true };
  }

  // Check matching rules
  for (const rule of ROUTE_ACCESS_RULES) {
    if (pathname.startsWith(rule.prefix)) {
      if (rule.allowedRoles.includes(role)) {
        return { authorized: true, allowedRoles: rule.allowedRoles };
      }
      return { authorized: false, allowedRoles: rule.allowedRoles };
    }
  }

  // Restricted base dashboard: Judge and Participant should go to their specific portal
  if (pathname === "/dashboard") {
    if (role === "PARTICIPANT" || role === "JUDGE" || role === "SUPER_ADMIN") {
      return { authorized: false, allowedRoles: ["ORGANIZATION_ADMIN", "EVENT_ADMIN", "COORDINATOR"] };
    }
  }

  return { authorized: true };
}

/**
 * Returns default home route for a role.
 */
export function getRoleHomeRoute(role: UserRole): string {
  return ROLE_CONFIGS[role]?.portalPath || "/dashboard";
}
