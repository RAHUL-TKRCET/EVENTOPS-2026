"use client";

import React from "react";
import { useAppStore } from "@/store";
import { UserRole } from "@/types";
import { ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const roleDescriptions: Record<UserRole, { label: string; badge: string; color: string }> = {
  SUPER_ADMIN: { label: "Super Admin", badge: "Platform Owner", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  ORGANIZATION_ADMIN: { label: "Org Admin", badge: "Tenant Lead", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
  EVENT_ADMIN: { label: "Event Admin", badge: "Director of Ops", color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  COORDINATOR: { label: "Coordinator", badge: "Floor Lead", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  JUDGE: { label: "Judge / Evaluator", badge: "Jury Panel", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  VOLUNTEER: { label: "Volunteer", badge: "Field Ops", color: "text-teal-400 bg-teal-500/10 border-teal-500/30" },
  PARTICIPANT: { label: "Participant", badge: "Hacker / Team", color: "text-pink-400 bg-pink-500/10 border-pink-500/30" },
  TECHNICAL_STAFF: { label: "Technical Staff", badge: "NetOps & Power", color: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
  RESOURCE_MANAGER: { label: "Resource Manager", badge: "Catering & Kits", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
};

export const RoleSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { currentRole, currentUser } = useAppStore();
  const effectiveRole = currentUser?.role || currentRole || "EVENT_ADMIN";
  const currentMeta = roleDescriptions[effectiveRole] || roleDescriptions["EVENT_ADMIN"];

  return (
    <div className={cn("relative select-none", className)}>
      <div
        className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-800/80 bg-slate-900/60 text-left"
        title="Active RBAC Role: Locked to your verified login credentials."
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-100">
                {currentMeta.label}
              </span>
            </div>
            <span className={cn("text-[9px] font-mono px-1.5 py-0.2 rounded border", currentMeta.color)}>
              {currentMeta.badge}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 pr-1 text-slate-500" title="Role Locked (Strict RBAC)">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </div>
  );
};

