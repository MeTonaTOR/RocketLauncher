"use client";

import { useLauncherStore } from "@/stores/launcherStore";
import { useServerStore } from "@/stores/serverStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { maskEmail } from "@/lib/utils";
import { LogOut, User, Wifi } from "lucide-react";

export function Header() {
  const { isLoggedIn, isGameRunning, userEmail, logout } = useLauncherStore();
  const { selectedServer } = useServerStore();
  const { settings } = useSettingsStore();

  return (
    <header className="h-11 shrink-0 bg-surface/30 border-b border-border/50 flex items-center justify-between px-5">
      <div className="flex items-center gap-2">
        {selectedServer && (
          <div className="flex items-center gap-2 text-xs">
            <Wifi size={12} className="text-success" />
            <span className="text-muted-foreground">Connected to</span>
            <span className="font-medium text-foreground">
              {selectedServer.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
              <User size={12} className="text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">
              {settings.streamingSupport ? maskEmail(userEmail) : userEmail}
            </span>
            <button
              onClick={logout}
              disabled={isGameRunning}
              className="text-muted hover:text-danger transition-smooth ml-1 cursor-pointer p-1 rounded hover:bg-danger/10 disabled:opacity-30 disabled:pointer-events-none"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted">Not signed in</span>
        )}
      </div>
    </header>
  );
}
