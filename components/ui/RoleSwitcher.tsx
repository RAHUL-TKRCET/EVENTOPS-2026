"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store";
import { UserRole } from "@/types";
import { ShieldAlert, UserCog, Check, ChevronDown } from "lucide-react";
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

import { useRouter } from "next/navigation";
import { getRoleHomeRoute } from "@/lib/permissions";
import { mockUsers } from "@/lib/mock-data/users";

export const RoleSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();
  const { currentRole, setCurrentRole, setCurrentUser } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentMeta = roleDescriptions[currentRole] || roleDescriptions["EVENT_ADMIN"];

  const handleSelectRole = (role: UserRole) => {
    setCurrentRole(role);
    const matchedUser = mockUsers.find((u) => u.role === role);
    if (matchedUser) {
      setCurrentUser(matchedUser);
    }
    setIsOpen(false);
    const targetRoute = getRoleHomeRoute(role);
    router.push(targetRoute);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800/90 transition text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
            <UserCog className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-100 group-hover:text-white">
                {currentMeta.label}
              </span>
            </div>
            <span className={cn("text-[9px] font-mono px-1.5 py-0.2 rounded border", currentMeta.color)}>
              {currentMeta.badge}
            </span>
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-1.5 space-y-1 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider flex items-center justify-between">
              <span>DEV ONLY • SIMULATE ROLE</span>
            </div>
            {(Object.keys(roleDescriptions) as UserRole[]).map((role) => {
              const meta = roleDescriptions[role];
              const isSelected = currentRole === role;
              return (
                <button
                  key={role}
                  onClick={() => handleSelectRole(role)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer text-left",
                    isSelected ? "bg-indigo-600/20 text-indigo-300 font-semibold" : "text-slate-300 hover:bg-slate-800"
                  )}
                >
                  <div className="truncate">
                    <div>{meta.label}</div>
                    <div className="text-[10px] text-slate-400">{meta.badge}</div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
