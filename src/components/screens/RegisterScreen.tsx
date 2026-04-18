"use client";

import { RegisterForm } from "@/components/forms/RegisterForm";
import { useLauncherStore } from "@/stores/launcherStore";
import { useServerStore } from "@/stores/serverStore";
import { Server } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function RegisterScreen() {
  const { setPage } = useLauncherStore();
  const { selectedServer } = useServerStore();

  return (
    <div className="flex-1 flex items-center justify-center p-5 overflow-y-auto">
      <div className="w-[24rem]">
        <div className="bg-surface border border-border rounded-2xl p-6 animate-scale-in">
          {selectedServer ? (
            <>
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
                <Server size={14} className="text-primary" />
                <span className="text-xs text-muted">
                  Register on:{" "}
                  <span className="text-foreground font-medium">
                    {selectedServer.name}
                  </span>
                </span>
              </div>
              <RegisterForm />
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted text-sm mb-3">
                Select a server to register on.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage("servers")}
              >
                Browse Servers
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
