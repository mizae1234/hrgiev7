import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline" | "purple";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-100 text-slate-800 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    outline: "bg-transparent text-slate-700 border-slate-300",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-medium",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1 rounded-full border transition-colors",
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
}
