import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-sm shadow-teal-700/20 focus-visible:ring-teal-500",
    secondary:
      "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400",
    outline:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-slate-400",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm shadow-rose-700/20 focus-visible:ring-rose-500",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400",
    link:
      "bg-transparent text-teal-600 underline-offset-4 hover:underline focus-visible:ring-teal-500 p-0",
  };

  const sizeStyles = {
    sm: "h-8 px-3 text-xs rounded-md",
    md: "h-10 px-4 py-2 text-sm rounded-lg",
    lg: "h-12 px-6 text-base rounded-xl font-medium",
    icon: "h-9 w-9 p-0 rounded-lg justify-center",
  };

  return (
    <button
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center gap-2 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
      {children}
    </button>
  );
}
