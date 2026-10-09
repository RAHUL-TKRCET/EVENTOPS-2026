"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi, ROLE_DEFAULT_USERS, ROLE_PASSWORDS } from "@/lib/api/auth";
import { useAppStore } from "@/store";
import { getRoleHomeRoute, ROLE_CONFIGS } from "@/lib/permissions";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  UserCheck,
  Building2,
  Calendar,
  Scale,
  GraduationCap,
  Wrench,
  Box,
  Compass,
  Crown,
  HeartHandshake,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { UserRole } from "@/types";

interface RoleCardMeta {
  role: UserRole;
  label: string;
  badge: string;
  description: string;
  targetPortal: string;
  icon: React.ReactNode;
  accentBg: string;
  borderColor: string;
  activeBorder: string;
  textColor: string;
}

const ROLES_LIST: RoleCardMeta[] = [
  {
    role: "EVENT_ADMIN",
    label: "Event Admin",
    badge: "Director of Ops",
    description: "End-to-end event operations, scheduling, rooms, and control center",
    targetPortal: "/dashboard",
    icon: <Calendar className="w-5 h-5 text-sky-400" />,
    accentBg: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    activeBorder: "border-sky-400 ring-2 ring-sky-500/20 bg-sky-500/15",
    textColor: "text-sky-400",
  },
  {
    role: "VOLUNTEER",
    label: "Volunteer",
    badge: "Field Operations",
    description: "Shift assignments, task check-off, zone check-in, and incident escalation",
    targetPortal: "/volunteers",
    icon: <HeartHandshake className="w-5 h-5 text-teal-400" />,
    accentBg: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    activeBorder: "border-teal-400 ring-2 ring-teal-500/20 bg-teal-500/15",
    textColor: "text-teal-400",
  },
  {
    role: "COORDINATOR",
    label: "Coordinator",
    badge: "Floor Lead",
    description: "Live floor management, attendance monitoring, and rapid resolution",
    targetPortal: "/dashboard",
    icon: <Compass className="w-5 h-5 text-emerald-400" />,
    accentBg: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    activeBorder: "border-emerald-400 ring-2 ring-emerald-500/20 bg-emerald-500/15",
    textColor: "text-emerald-400",
  },
  {
    role: "PARTICIPANT",
    label: "Participant / Student",
    badge: "Hacker / Student",
    description: "Digital EventPass, workstation desk, schedule, and live tournament results",
    targetPortal: "/participant",
    icon: <GraduationCap className="w-5 h-5 text-pink-400" />,
    accentBg: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    activeBorder: "border-pink-400 ring-2 ring-pink-500/20 bg-pink-500/15",
    textColor: "text-pink-400",
  },
  {
    role: "JUDGE",
    label: "Judge / Evaluator",
    badge: "Jury Panel",
    description: "Assigned team reviews, scoring rubrics, and feedback submission",
    targetPortal: "/judge",
    icon: <Scale className="w-5 h-5 text-amber-400" />,
    accentBg: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    activeBorder: "border-amber-400 ring-2 ring-amber-500/20 bg-amber-500/15",
    textColor: "text-amber-400",
  },
  {
    role: "SUPER_ADMIN",
    label: "Super Admin",
    badge: "Platform Owner",
    description: "Platform-wide governance, global tenants, quotas, and telemetry",
    targetPortal: "/super-admin",
    icon: <Crown className="w-5 h-5 text-purple-400" />,
    accentBg: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    activeBorder: "border-purple-400 ring-2 ring-purple-500/20 bg-purple-500/15",
    textColor: "text-purple-400",
  },
  {
    role: "ORGANIZATION_ADMIN",
    label: "Organization Admin",
    badge: "Institution Lead",
    description: "University & company workspace, multi-event hosting, and staff",
    targetPortal: "/dashboard",
    icon: <Building2 className="w-5 h-5 text-indigo-400" />,
    accentBg: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    activeBorder: "border-indigo-400 ring-2 ring-indigo-500/20 bg-indigo-500/15",
    textColor: "text-indigo-400",
  },
  {
    role: "TECHNICAL_STAFF",
    label: "Technical Staff",
    badge: "NetOps & Power",
    description: "Hardware diagnostics, power breakers, networking, and room readiness",
    targetPortal: "/technical-staff",
    icon: <Wrench className="w-5 h-5 text-orange-400" />,
    accentBg: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    activeBorder: "border-orange-400 ring-2 ring-orange-500/20 bg-orange-500/15",
    textColor: "text-orange-400",
  },
  {
    role: "RESOURCE_MANAGER",
    label: "Resource Manager",
    badge: "Catering & Supplies",
    description: "Meals, merchandise, swag kits, equipment inventory, and badges",
    targetPortal: "/resource-manager",
    icon: <Box className="w-5 h-5 text-rose-400" />,
    accentBg: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    activeBorder: "border-rose-400 ring-2 ring-rose-500/20 bg-rose-500/15",
    textColor: "text-rose-400",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, setCurrentRole } = useAppStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>("EVENT_ADMIN");
  const [email, setEmail] = useState(ROLE_DEFAULT_USERS.EVENT_ADMIN.email);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [authSuccess, setAuthSuccess] = useState(false);

  const currentRoleMeta = ROLES_LIST.find((r) => r.role === selectedRole) || ROLES_LIST[0];
  const roleDefaultPass = ROLE_PASSWORDS[selectedRole] || "EventOps@2026";

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError("");
    setAuthSuccess(false);
    if (ROLE_DEFAULT_USERS[role]) {
      setEmail(ROLE_DEFAULT_USERS[role].email);
    }
  };

  const fillSuggestedPassword = () => {
    setPassword(roleDefaultPass);
    setError("");
  };

  const handleAuthenticatedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAuthSuccess(false);

    if (!email) {
      setError("Email address is required for identity verification.");
      return;
    }

    if (!password) {
      setError("Security password is required. Every login must be authenticated to avoid misuse.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.login(email, password, selectedRole);
      setAuthSuccess(true);
      setCurrentUser(res.user);
      setCurrentRole(selectedRole);

      // Short delay for user feedback on verified authentication
      setTimeout(() => {
        const targetRoute = getRoleHomeRoute(selectedRole);
        router.push(targetRoute);
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Authentication credentials invalid. Access denied.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-md space-y-6">
      {/* Brand & Security Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-600 text-white font-mono font-bold text-lg shadow-lg shadow-indigo-500/30">
            EO
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              EVENTOPS <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-normal">SECURE RBAC</span>
            </h1>
            <p className="text-xs text-slate-400">
              Zero-Trust Role-Based Authentication Terminal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Every Access Attempt Authenticated & Audited</span>
        </div>
      </div>

      {/* Main Two-Column Layout: Role Selection on Left, Authenticated Login Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Role Selector Grid (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Step 1: Choose Your Operational Role
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              9 Scoped Roles
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Select the authorized role to configure credentials and clearance boundaries. Unauthenticated access is strictly forbidden.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {ROLES_LIST.map((r) => {
              const isSelected = selectedRole === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRoleSelect(r.role)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? r.activeBorder
                      : `bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {r.icon}
                    </div>
                    {isSelected ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    ) : (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-900 text-slate-500 border border-slate-800">
                        {r.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white leading-tight">{r.label}</h3>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{r.badge}</p>
                  </div>

                  <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{r.targetPortal}</span>
                    <span className={isSelected ? r.textColor : "text-slate-400"}>
                      {isSelected ? "Active" : "Select"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Security & Audit Guidelines Callout */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-indigo-400 font-mono font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Anti-Misuse & Audit Policy</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              To prevent role misuse, participants cannot access Administrative or Jury terminals, and operational staff are isolated within their scoped event boundaries. Each authentication exchange generates a cryptographic session token logged in the system ledger.
            </p>
          </div>
        </div>

        {/* Right Column: Authenticated Credential Form (5 cols on lg) */}
        <div className="lg:col-span-5 p-5 rounded-3xl border border-slate-800 bg-slate-950/70 space-y-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
              Step 2: Authenticate Identity
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-white">{currentRoleMeta.label}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${currentRoleMeta.accentBg} ${currentRoleMeta.textColor} ${currentRoleMeta.borderColor}`}>
                {currentRoleMeta.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {currentRoleMeta.description}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Identity Verified. Establishing encrypted session...</span>
            </div>
          )}

          <form onSubmit={handleAuthenticatedSubmit} className="space-y-4">
            <Input
              label="Authorized Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.com"
            />

            <div className="space-y-1">
              <Input
                label="Security Password / Passcode"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Password Helper & Demo Fill for Authorized Testing */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={fillSuggestedPassword}
                  className="text-indigo-400 hover:text-indigo-300 transition cursor-pointer font-mono flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Use default demo passcode</span>
                </button>

                <Link
                  href="/forgot-password"
                  className="text-slate-500 hover:text-slate-400 transition"
                >
                  Forgot?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              disabled={authSuccess}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {authSuccess
                ? "Access Granted ✓"
                : `Authenticate as ${currentRoleMeta.label}`}
            </Button>
          </form>

          {/* Authorized Credentials Reference Table for Testing */}
          <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1 text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Target Portal:</span>
              <span className="text-indigo-300 font-bold">{currentRoleMeta.targetPortal}</span>
            </div>
            <div className="flex justify-between">
              <span>Auth Method:</span>
              <span className="text-slate-300">Password / HMAC Token</span>
            </div>
            <div className="flex justify-between">
              <span>Passcode for Testing:</span>
              <code className="text-amber-400 bg-slate-900 px-1 rounded">{roleDefaultPass}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div>
          Need a new organization?{" "}
          <Link href="/register" className="text-indigo-400 font-semibold hover:underline">
            Register Organization & Events
          </Link>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          ISO-27001 & SOC-2 RBAC Compliant • Panch Pandavs
        </div>
      </div>
    </div>
  );
}
