"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet";
  className?: string;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType = "neutral",
  subtitle,
  icon,
  accentColor = "indigo",
  className,
  onClick,
}) => {
  const accentStyles = {
    indigo: "border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 bg-indigo-500/5",
    emerald: "border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 bg-emerald-500/5",
    amber: "border-amber-500/20 hover:border-amber-500/40 text-amber-400 bg-amber-500/5",
    rose: "border-rose-500/20 hover:border-rose-500/40 text-rose-400 bg-rose-500/5",
    sky: "border-sky-500/20 hover:border-sky-500/40 text-sky-400 bg-sky-500/5",
    violet: "border-violet-500/20 hover:border-violet-500/40 text-violet-400 bg-violet-500/5",
  };

  const changeStyles = {
    positive: "text-emerald-400 bg-emerald-500/10",
    negative: "text-rose-400 bg-rose-500/10",
    neutral: "text-slate-400 bg-slate-800",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border bg-slate-900/70 backdrop-blur-sm transition-all duration-200 shadow-sm",
        accentStyles[accentColor],
        onClick && "cursor-pointer hover:scale-[1.01]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">{value}</span>
            {change && (
              <span
                className={cn(
                  "text-[11px] font-medium px-1.5 py-0.5 rounded-full font-mono",
                  changeStyles[changeType]
                )}
              >
                {change}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  action,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-4",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};
