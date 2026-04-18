"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  disabled,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  function close() {
    setClosing(true);
  }

  function updatePosition() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }

  useEffect(() => {
    if (!open) return;
    updatePosition();

    function handleClose(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      close();
    }

    function handleScroll() { updatePosition(); }

    document.addEventListener("mousedown", handleClose);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  const dropdown = open && typeof document !== "undefined" && createPortal(
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className={cn(
        "rounded-lg border border-border bg-surface shadow-xl overflow-hidden",
        closing ? "animate-select-out" : "animate-select-in"
      )}
      onAnimationEnd={() => {
        if (closing) { setClosing(false); setOpen(false); }
      }}
    >
      <div className="max-h-52 overflow-y-auto py-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onChange(option.value); close(); setClosing(false); setOpen(false); }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer transition-colors duration-100",
              option.value === value
                ? "text-primary bg-primary/10"
                : "text-foreground hover:bg-surface-hover"
            )}
          >
            <span>{option.label}</span>
            {option.value === value && <Check size={11} className="text-primary shrink-0" />}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (open) { close(); } else { updatePosition(); setOpen(true); }
        }}
        className={cn(
          "w-full flex items-center justify-between gap-2",
          "rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs text-foreground",
          "hover:border-muted/60 transition-colors duration-150 cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          open && !closing && "border-primary/50 ring-2 ring-primary/30"
        )}
      >
        <span className={cn(!selected && "text-muted/60")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={12}
          className={cn("text-muted shrink-0 transition-transform duration-150", open && !closing && "rotate-180")}
        />
      </button>

      {dropdown}
    </div>
  );
}
