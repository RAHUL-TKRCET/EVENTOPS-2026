"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-2.5 py-1.5 text-xs font-medium rounded-md gap-1.5",
      md: "px-3.5 py-2 text-sm font-medium rounded-lg gap-2",
      lg: "px-5 py-2.5 text-base font-medium rounded-xl gap-2.5",
    };

    const variantClasses = {
      primary:
        "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 active:scale-[0.98] border border-transparent",
      secondary:
        "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 active:scale-[0.98]",
      outline:
        "bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white border border-slate-700/80 active:scale-[0.98]",
      ghost:
        "bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent",
      danger:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20 active:scale-[0.98] border border-transparent",
      success:
        "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 active:scale-[0.98] border border-transparent",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
