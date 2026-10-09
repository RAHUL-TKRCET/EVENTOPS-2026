"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40",
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 mb-3 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" variant="primary" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 4,
  className,
}) => {
  return (
    <div className={cn("space-y-3 animate-pulse", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-800/60 rounded-lg w-full" />
      ))}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = "Failed to load data",
  message = "An error occurred while fetching information from the operations cluster.",
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        "p-6 rounded-xl border border-rose-500/20 bg-rose-500/5 text-center flex flex-col items-center",
        className
      )}
    >
      <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
      <h4 className="text-sm font-semibold text-rose-300">{title}</h4>
      <p className="text-xs text-rose-400/80 max-w-md mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export const Alert: React.FC<{
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ type = "info", title, children, className }) => {
  const styles = {
    info: {
      border: "border-sky-500/30 bg-sky-500/10 text-sky-300",
      icon: <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />,
    },
    success: {
      border: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
    },
    warning: {
      border: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
    },
    error: {
      border: "border-rose-500/30 bg-rose-500/10 text-rose-300",
      icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />,
    },
  };

  return (
    <div className={cn("p-3.5 rounded-lg border flex items-start gap-2.5 text-xs", styles[type].border, className)}>
      {styles[type].icon}
      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div>{children}</div>
      </div>
    </div>
  );
};

export const ProgressBar: React.FC<{
  value: number; // 0 to 100
  max?: number;
  color?: "indigo" | "emerald" | "amber" | "rose";
  className?: string;
  showLabel?: boolean;
}> = ({ value, max = 100, color = "indigo", className, showLabel = false }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };

  return (
    <div className={cn("w-full space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>Progress</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", colors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export const Stepper: React.FC<{
  steps: { id: string; title: string; subtitle?: string }[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
  className?: string;
}> = ({ steps, currentStepIndex, onStepClick, className }) => {
  return (
    <div className={cn("flex items-center justify-between gap-2 overflow-x-auto py-2", className)}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStepIndex;
        const isCurrent = idx === currentStepIndex;

        return (
          <div
            key={step.id}
            onClick={() => onStepClick && onStepClick(idx)}
            className={cn(
              "flex items-center gap-2.5 transition select-none shrink-0",
              onStepClick && "cursor-pointer"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition",
                isCompleted
                  ? "bg-emerald-500 text-white"
                  : isCurrent
                  ? "bg-indigo-600 text-white ring-4 ring-indigo-500/20"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              )}
            >
              {isCompleted ? "✓" : idx + 1}
            </div>
            <div className="hidden sm:block">
              <p
                className={cn(
                  "text-xs font-medium",
                  isCurrent ? "text-indigo-400 font-semibold" : isCompleted ? "text-slate-200" : "text-slate-400"
                )}
              >
                {step.title}
              </p>
              {step.subtitle && <p className="text-[10px] text-slate-400">{step.subtitle}</p>}
            </div>
            {idx < steps.length - 1 && (
              <div className="w-8 h-[1px] bg-slate-800 hidden md:block mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
};
