"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Judge, Incident } from "@/types";
import { AlertTriangle, Clock, MapPin, UserCheck, ShieldAlert, Award } from "lucide-react";
import { StatusBadge } from "./Badge";
import { ProgressBar } from "./Feedback";

export const JudgeWorkloadCard: React.FC<{
  judge: Judge;
  onSelect?: (judge: Judge) => void;
  className?: string;
}> = ({ judge, onSelect, className }) => {
  const isOverloaded = judge.workloadStatus === "OVERLOADED";

  return (
    <div
      onClick={() => onSelect && onSelect(judge)}
      className={cn(
        "p-4 rounded-xl border bg-slate-900/80 transition space-y-3",
        isOverloaded
          ? "border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60"
          : "border-slate-800 hover:border-slate-700",
        onSelect && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-400 shrink-0">
            {judge.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-100">{judge.name}</h4>
              <span className="font-mono text-[10px] text-slate-400">({judge.id})</span>
            </div>
            <p className="text-xs text-slate-400">{judge.designation} • {judge.organization}</p>
          </div>
        </div>
        <StatusBadge status={judge.workloadStatus} />
      </div>

      {/* Expertise domain tags */}
      <div className="flex flex-wrap gap-1">
        {judge.expertise.map((exp) => (
          <span
            key={exp}
            className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono border border-slate-700/60"
          >
            {exp}
          </span>
        ))}
      </div>

      {/* Workload metric */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>Assigned Teams ({judge.assignedTeams.length}/{judge.maxTeamCapacity})</span>
          <span className={cn("font-bold", isOverloaded ? "text-rose-400" : "text-slate-200")}>
            {judge.workload}%
          </span>
        </div>
        <ProgressBar
          value={judge.workload}
          color={isOverloaded ? "rose" : judge.workload > 70 ? "amber" : "indigo"}
        />
      </div>

      {/* Conflicts alert snippet */}
      {judge.conflicts.length > 0 && (
        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>{judge.conflicts[0]}</span>
        </div>
      )}
    </div>
  );
};

export const IncidentCard: React.FC<{
  incident: Incident;
  onStatusChange?: (id: string, nextStatus: Incident["status"]) => void;
  onClick?: () => void;
  className?: string;
}> = ({ incident, onStatusChange, onClick, className }) => {
  const priorityBorder = {
    CRITICAL: "border-rose-500/50 bg-rose-500/5 hover:border-rose-500",
    HIGH: "border-amber-500/40 bg-amber-500/5 hover:border-amber-500",
    MEDIUM: "border-sky-500/30 bg-sky-500/5 hover:border-sky-500",
    LOW: "border-slate-800 bg-slate-900/60 hover:border-slate-700",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border transition space-y-3",
        priorityBorder[incident.priority],
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-400">{incident.id}</span>
            <StatusBadge status={incident.priority} />
            <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
              {incident.category}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-100 mt-1">{incident.title}</h4>
        </div>
        <StatusBadge status={incident.status} />
      </div>

      <p className="text-xs text-slate-400 line-clamp-2">{incident.description}</p>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-indigo-400" />
            {incident.location}
          </span>
          {incident.assignedTo && (
            <span className="flex items-center gap-1 text-slate-300">
              <UserCheck className="w-3 h-3 text-emerald-400" />
              {incident.assignedTo.split(" ")[0]}
            </span>
          )}
        </div>

        {onStatusChange && incident.status !== "RESOLVED" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(incident.id, "RESOLVED");
            }}
            className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded transition cursor-pointer"
          >
            Mark Resolved ✓
          </button>
        )}
      </div>
    </div>
  );
};
