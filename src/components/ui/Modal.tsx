"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const ENTER_DURATION = 320;
const EXIT_DURATION  = 180;

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = "md",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useLayoutEffect(() => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (isOpen) {
      setRendered(true);
      const raf = requestAnimationFrame(() => {
        setVisible(true);
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      exitTimerRef.current = setTimeout(() => setRendered(false), EXIT_DURATION + 20);
      return () => {
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const sizes: Record<string, string> = {
    sm: "360px",
    md: "512px",
    lg: "672px",
    xl: "896px",
  };

  if (!mounted || !rendered) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          transition: `opacity ${visible ? ENTER_DURATION : EXIT_DURATION}ms ease`,
          opacity: visible ? 1 : 0,
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: sizes[size] ?? sizes.md,
          margin: "0 1rem",
          transition: visible
            ? `opacity ${ENTER_DURATION}ms ease-out, transform ${ENTER_DURATION}ms cubic-bezier(0.34,1.4,0.64,1)`
            : `opacity ${EXIT_DURATION}ms ease-in, transform ${EXIT_DURATION}ms ease-in`,
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.95) translateY(12px)",
        }}
        className={cn(
          "rounded-2xl border border-border bg-surface p-6 shadow-2xl",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground transition-smooth cursor-pointer p-1 rounded hover:bg-surface-hover"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

