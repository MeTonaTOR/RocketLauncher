"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLauncherStore } from "@/stores/launcherStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Rocket, Folder, ArrowRight } from "lucide-react";

export function WelcomeScreen() {
  const { setPage } = useLauncherStore();
  const { settings, setSettings } = useSettingsStore();
  const [gameDir, setGameDir] = useState(settings.installationDirectory || "");

  function handleContinue() {
    if (gameDir) {
      setSettings({ installationDirectory: gameDir });
    }
    setPage("main");
  }

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-surface border border-border rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Rocket size={28} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold text-gradient">Welcome!</h1>
            <p className="text-muted text-xs">
              Configure your Need for Speed World launcher before getting started.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              Game Installation Directory
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={gameDir}
                onChange={(e) => setGameDir(e.target.value)}
                placeholder="C:\Games\NFSW"
                className="flex-1 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-smooth"
              />
              <Button variant="secondary" size="md">
                <Folder size={14} />
              </Button>
            </div>
            <p className="text-[11px] text-muted">
              Select the folder where game files will be downloaded.
            </p>
          </div>
          <div className="bg-background/50 rounded-xl p-4 border border-border/50">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-1.5">Selected CDN</h3>
            <p className="text-xs font-mono text-muted-foreground">
              {settings.selectedCDN}
            </p>
            <p className="text-[11px] text-muted mt-1">
              You can change the CDN in Settings.
            </p>
          </div>
          <Button onClick={handleContinue} size="lg" className="w-full">
            Continue
            <ArrowRight size={14} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
