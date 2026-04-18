"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  variant?: "primary" | "accent" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = true,
  variant = "primary",
  size = "md",
  className,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const variants = {
    primary: "bg-primary",
    accent: "bg-accent",
    success: "bg-success",
    danger: "bg-danger",
  };

  const sizes = {
    sm: "h-1.5",
    md: "h-3",
    lg: "h-5",
  };

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-muted">{label}</span>}
          {showPercent && (
            <span className="text-sm font-mono text-muted">
              {percent.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full bg-border/50 rounded-full overflow-hidden",
          sizes[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variants[variant]
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
