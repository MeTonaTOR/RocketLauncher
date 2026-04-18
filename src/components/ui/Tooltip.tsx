"use client";

import { useState, useRef, useEffect, cloneElement, Children } from "react";
import type { ReactElement, ReactNode, MouseEvent, HTMLAttributes } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  label: string;
  children: ReactNode;
  placement?: "top" | "bottom";
}

const TOOLTIP_HEIGHT = 32;
const MARGIN = 8;

export function Tooltip({ label, children, placement = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, side: "top" as "top" | "bottom" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show(el: HTMLElement) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const r = el.getBoundingClientRect();

    const hasRoomAbove = r.top >= TOOLTIP_HEIGHT + MARGIN;
    const side = placement === "bottom" ? "bottom" : (hasRoomAbove ? "top" : "bottom");

    setPos({
      x: r.left + r.width / 2,
      y: side === "top" ? r.top - MARGIN : r.bottom + MARGIN,
      side,
    });
    setClosing(false);
    setVisible(true);
  }

  function hide() {
    setClosing(true);
    timerRef.current = setTimeout(() => setVisible(false), 150);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const child = Children.only(children) as ReactElement<HTMLAttributes<HTMLElement>>;

  const animIn = pos.side === "top"
    ? "tooltip-in 0.15s ease both"
    : "tooltip-in-bottom 0.15s ease both";
  const animOut = pos.side === "top"
    ? "tooltip-out 0.12s ease both"
    : "tooltip-out-bottom 0.12s ease both";

  return (
    <>
      {cloneElement(child, {
        onMouseEnter: (e: MouseEvent<HTMLElement>) => {
          child.props.onMouseEnter?.(e);
          show(e.currentTarget);
        },
        onMouseLeave: (e: MouseEvent<HTMLElement>) => {
          child.props.onMouseLeave?.(e);
          hide();
        },
      })}
      {visible &&
        createPortal(
          <div
            className="pointer-events-none fixed"
            style={{
              left: pos.x,
              top: pos.side === "top" ? pos.y : pos.y,
              zIndex: 9999,
              transform: pos.side === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
            }}
          >
            <div
              className="relative px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap bg-surface border border-border text-foreground shadow-lg"
              style={{ animation: closing ? animOut : animIn }}
            >
              {label}
              <span
                className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
                style={
                  pos.side === "top"
                    ? {
                        bottom: -4,
                        borderLeft: "4px solid transparent",
                        borderRight: "4px solid transparent",
                        borderTop: "4px solid var(--color-border)",
                      }
                    : {
                        top: -4,
                        borderLeft: "4px solid transparent",
                        borderRight: "4px solid transparent",
                        borderBottom: "4px solid var(--color-border)",
                      }
                }
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
