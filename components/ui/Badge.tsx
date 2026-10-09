"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "outline";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    purple: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    outline: "bg-transparent text-slate-300 border-slate-700",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] font-medium rounded",
    md: "px-2.5 py-1 text-xs font-medium rounded-md",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border font-mono tracking-tight",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const norm = status?.toUpperCase() || "";

  let variant: BadgeProps["variant"] = "default";
  let dotColor = "bg-slate-400";

  if (["CHECKED_IN", "APPROVED", "OPTIMAL", "RESOLVED", "COMPLETED", "ACTIVE", "HEALTHY", "LIVE"].includes(norm)) {
    variant = "success";
    dotColor = "bg-emerald-400";
  } else if (["PARTIAL", "IN_PROGRESS", "BUSY", "LOW_STOCK", "ASSIGNED", "WARNING"].includes(norm)) {
    variant = "warning";
    dotColor = "bg-amber-400 animate-pulse";
  } else if (["ABSENT", "REJECTED", "CRITICAL", "OVERLOADED", "DEPLETED", "MAINTENANCE"].includes(norm)) {
    variant = "danger";
    dotColor = "bg-rose-400";
  } else if (["PENDING", "OPEN", "UPCOMING", "STANDBY", "DRAFT"].includes(norm)) {
    variant = "info";
    dotColor = "bg-sky-400";
  } else if (["LOCKED", "SUBMITTED"].includes(norm)) {
    variant = "purple";
    dotColor = "bg-indigo-400";
  }

  return (
    <Badge variant={variant} className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} />
      {status.replace(/_/g, " ")}
    </Badge>
  );
};
