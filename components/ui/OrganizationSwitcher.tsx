"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store";
import {
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Plus,
  KeyRound,
  LayoutGrid,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export const OrganizationSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();
  const {
    workspaceMode,
    currentOrganization,
    userOrganizations,
    personalEvents,
    activePersonalEvent,
    selectOrganizationWorkspace,
    selectPersonalEventWorkspace,
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);

  const isOrgMode = workspaceMode === "ORGANIZATION";

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800/90 transition text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className={cn(
              "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors",
              isOrgMode
                ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400"
                : "bg-amber-500/20 border-amber-500/30 text-amber-400"
            )}
          >
            {isOrgMode ? <Building2 className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-100 truncate group-hover:text-white">
                {isOrgMode
                  ? currentOrganization?.name || "TKR College"
                  : activePersonalEvent?.name || "Personal Event"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span
                className={cn(
                  "font-mono px-1.5 py-0.2 rounded text-[9px] font-medium uppercase tracking-wider",
                  isOrgMode
                    ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                )}
              >
                {isOrgMode
                  ? `${currentOrganization?.type || "Institution"}${currentOrganization?.subtype ? ` • ${currentOrganization.subtype}` : ""}`
                  : "Personal Event"}
              </span>
            </div>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 group-hover:text-slate-200 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            {/* Header: Current Workspace Mode Indicator */}
            <div className="px-2 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                Current Workspace
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono font-semibold",
                  isOrgMode
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                )}
              >
                {isOrgMode ? "Organization Mode" : "Personal Event Mode"}
              </span>
            </div>

            {/* Organizations Section */}
            <div>
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                <span>Your Organizations</span>
                <span className="text-slate-500">({userOrganizations?.length || 0})</span>
              </div>
              <div className="space-y-0.5">
                {(userOrganizations || []).map((org) => {
                  const isSelected = isOrgMode && org.id === currentOrganization?.id;
                  return (
                    <button
                      key={org.id}
                      onClick={() => {
                        selectOrganizationWorkspace(org.id);
                        setIsOpen(false);
                        router.push("/dashboard");
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer text-left group/item",
                        isSelected
                          ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 font-medium"
                          : "text-slate-300 hover:bg-slate-800/80"
                      )}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate group-hover/item:text-white font-medium">{org.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {org.type} {org.subtype ? `• ${org.subtype}` : ""}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personal Events Section */}
            <div>
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                <span>Personal Events</span>
                <span className="text-slate-500">({personalEvents?.length || 0})</span>
              </div>
              <div className="space-y-0.5">
                {(personalEvents || []).map((evt) => {
                  const isSelected = !isOrgMode && (activePersonalEvent?.id === evt.id);
                  return (
                    <button
                      key={evt.id}
                      onClick={() => {
                        selectPersonalEventWorkspace(evt.id);
                        setIsOpen(false);
                        router.push(`/events/${evt.id}`);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer text-left group/item",
                        isSelected
                          ? "bg-amber-500/20 text-amber-200 border border-amber-500/30 font-medium"
                          : "text-slate-300 hover:bg-slate-800/80"
                      )}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate group-hover/item:text-white font-medium">{evt.name}</div>
                        <div className="text-[10px] text-amber-400/80 font-mono">
                          {evt.type} • {evt.registeredTeamsCount || 0} participants
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-1.5 border-t border-slate-800 space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/workspace");
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/80 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                  <span>Workspace Selection Hub</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/organizations/create");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-indigo-400 hover:bg-indigo-500/10 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Create Organization</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/organizations/join");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/10 transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Join Organization with Code</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/personal-events/create");
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-amber-400 hover:bg-amber-500/10 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Create Personal Event</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
