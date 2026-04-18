"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

export function Input({ label, error, className, wrapperClassName, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-muted mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
          "transition-all duration-200 ease-out hover:border-muted/60",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface/30 disabled:hover:border-border",
          error && "border-danger/50 focus:ring-danger/30",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
