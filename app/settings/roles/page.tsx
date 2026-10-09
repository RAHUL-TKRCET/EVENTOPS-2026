"use client";

import React, { useState } from "react";
import { UserRole } from "@/types";
import { ShieldCheck, Check, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsNav = [
  { label: "Organization", href: "/settings/organization" },
  { label: "User Profile", href: "/settings/profile" },
  { label: "Roles & Permissions", href: "/settings/roles" },
  { label: "Notification Channels", href: "/settings/notifications" },
  { label: "Security & MFA", href: "/settings/security" },
  { label: "API & Integrations", href: "/settings/integrations" },
];

const roles: { role: UserRole; label: string }[] = [
  { role: "SUPER_ADMIN", label: "Super Admin" },
  { role: "ORGANIZATION_ADMIN", label: "Org Admin" },
  { role: "EVENT_ADMIN", label: "Event Admin" },
  { role: "COORDINATOR", label: "Coordinator" },
  { role: "JUDGE", label: "Judge / Evaluator" },
  { role: "VOLUNTEER", label: "Volunteer" },
  { role: "PARTICIPANT", label: "Participant" },
  { role: "TECHNICAL_STAFF", label: "Technical Staff" },
  { role: "RESOURCE_MANAGER", label: "Resource Mgr" },
];

const permissions = [
  { id: "manage_events", label: "Manage Event Specs" },
  { id: "register_teams", label: "Team Registration" },
  { id: "qr_checkin", label: "High-Speed QR Check-in" },
  { id: "run_allocator", label: "Run CP-SAT Solver" },
  { id: "control_center", label: "Access Control Center" },
  { id: "submit_rubrics", label: "Submit Jury Rubrics" },
  { id: "advance_rounds", label: "Promote Tournament Rounds" },
  { id: "manage_tasks", label: "Assign Volunteer Tasks" },
  { id: "track_meals", label: "Meal Pass Telemetry" },
  { id: "resolve_incidents", label: "Resolve Incidents" },
  { id: "send_broadcasts", label: "Broadcast Notifications" },
];

// Default Matrix definitions
const defaultMatrix: Record<UserRole, string[]> = {
  SUPER_ADMIN: permissions.map((p) => p.id),
  ORGANIZATION_ADMIN: permissions.map((p) => p.id),
  EVENT_ADMIN: permissions.map((p) => p.id),
  COORDINATOR: ["manage_events", "register_teams", "qr_checkin", "run_allocator", "control_center", "advance_rounds", "manage_tasks", "track_meals", "resolve_incidents", "send_broadcasts"],
  JUDGE: ["submit_rubrics"],
  VOLUNTEER: ["qr_checkin", "manage_tasks"],
  PARTICIPANT: ["register_teams"],
  TECHNICAL_STAFF: ["control_center", "resolve_incidents"],
  RESOURCE_MANAGER: ["control_center", "track_meals"],
};

export default function RolesPermissionsPage() {
  const pathname = usePathname();
  const [matrix, setMatrix] = useState<Record<UserRole, string[]>>(defaultMatrix);

  const togglePermission = (role: UserRole, permId: string) => {
    setMatrix((prev) => {
      const current = prev[role] || [];
      const has = current.includes(permId);
      const next = has ? current.filter((id) => id !== permId) : [...current, permId];
      return { ...prev, [role]: next };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-mono text-white">System & Workspace Settings</h2>
        <p className="text-xs text-slate-400">
          Fine-grained Role-Based Access Control (RBAC) permission matrix.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        {settingsNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition whitespace-nowrap ${
              pathname === item.href
                ? "bg-indigo-600 text-white font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span>Role × Permission Security Matrix</span>
        </div>
        <p className="text-xs text-slate-400">
          Click any cell to toggle feature authorizations across personas.
        </p>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <th className="py-2.5 px-3">System Permission</th>
                {roles.map((r) => (
                  <th key={r.role} className="py-2.5 px-2 text-center whitespace-nowrap">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {permissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 text-slate-200 font-sans font-medium">{perm.label}</td>
                  {roles.map((r) => {
                    const isEnabled = matrix[r.role]?.includes(perm.id);
                    return (
                      <td key={r.role} className="py-3 px-2 text-center">
                        <button
                          onClick={() => togglePermission(r.role, perm.id)}
                          className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition cursor-pointer ${
                            isEnabled
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                              : "bg-slate-950 text-slate-600 border border-slate-800 hover:text-slate-400"
                          }`}
                        >
                          {isEnabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
