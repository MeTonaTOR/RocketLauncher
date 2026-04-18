"use client";

import { cn } from "@/lib/utils";
import type { ServerInfo } from "@/lib/types";
import { Globe, Users, Shield } from "lucide-react";
import { getServerIcon } from "@/lib/serverIcons";

interface ServerCardProps {
  server: ServerInfo;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ServerCard({ server, isSelected, onClick }: ServerCardProps) {
  const localIcon = getServerIcon(server.id);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border p-3 transition-smooth cursor-pointer",
        "hover:bg-surface-hover hover:border-primary/30 hover:scale-[1.02] active:scale-[0.98]",
        isSelected
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-surface"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
          {localIcon || server.iconUrl ? (
            <img
              src={localIcon || server.iconUrl}
              alt=""
              className="w-full h-full rounded-lg object-cover"
            />
          ) : (
            <Globe size={16} className="text-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{server.name}</span>
            {server.isOfficial && (
              <Shield size={12} className="text-primary shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted">
            {server.category && (
              <span className="bg-surface-hover px-1.5 py-0.5 rounded text-[10px]">
                {server.category}
              </span>
            )}
            {server.country && <span>{server.country}</span>}
            {server.registeredCount !== undefined && (
              <span className="flex items-center gap-0.5">
                <Users size={10} />
                {server.registeredCount}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          {server.ping !== undefined && (
            <span
              className={cn(
                "inline-block w-2.5 h-2.5 rounded-full",
                server.ping >= 0 ? "bg-success" : "bg-danger"
              )}
              title={server.ping >= 0 ? "Online" : "Offline"}
            />
          )}
          {server.onlineCount !== undefined && (
            <div className="text-[10px] text-success mt-0.5">
              {server.onlineCount} online
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
