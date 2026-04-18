"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useServerStore } from "@/stores/serverStore";
import { useLauncherStore } from "@/stores/launcherStore";
import { fetchServerList, pingServer } from "@/lib/tauri-api";
import type { ServerInfo } from "@/lib/types";
import {
  Search,
  Plus,
  X,
  Globe,
  Users,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getServerIcon } from "@/lib/serverIcons";
import { Tooltip } from "@/components/ui/Tooltip";

export function ServerListPanel() {
  const {
    servers,
    customServers,
    selectedServer,
    setServers,
    selectServer,
    addCustomServer,
    setLoading,
    isLoading,
  } = useServerStore();
  const { setPage, isLoggedIn, isAutoVerifying, downloadProgress } = useLauncherStore();

  const serverLocked = isAutoVerifying || downloadProgress.status === "downloading" || downloadProgress.status === "extracting";

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIp, setNewIp] = useState("");

  const allServers = [...servers, ...customServers];

  const q = search.toLowerCase();
  const filteredServers = allServers.filter(s =>
    !q || s.name.toLowerCase().includes(q) || s.ip.toLowerCase().includes(q)
  );

  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingAbortRef = useRef(false);

  async function pingAllServers(serverList: ServerInfo[], force = false) {
    pingAbortRef.current = false;
    const toPing = force
      ? serverList.filter((s) => s.ip)
      : serverList.filter((s) => s.ip && s.ping === undefined);
    const batchSize = 5;

    for (let i = 0; i < toPing.length; i += batchSize) {
      if (pingAbortRef.current) break;
      const batch = toPing.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (s) => {
          try {
            const ping = await pingServer(s.ip);
            if (!pingAbortRef.current) {
              const store = useServerStore.getState();
              store.updateServerPing(s.id, ping);
            }
          } catch {}
        })
      );
    }
  }

  async function loadServers() {
    setLoading(true);
    try {
      const list = await fetchServerList();
      const offlineList = list.map((s) => ({ ...s, ping: -1 as number }));
      setServers(offlineList);

      const previousId = selectedServer?.id;
      if (previousId) {
        const found = offlineList.find((s) => s.id === previousId);
        if (found) {
          selectServer({ ...found, ping: -1 });
        } else {
          selectServer(offlineList[0] || null);
        }
      } else if (offlineList.length > 0) {
        selectServer(offlineList[0]);
      }
      pingAllServers(offlineList, true);

      if (previousId) {
        setTimeout(() => {
          const store = useServerStore.getState();
          const current = store.selectedServer;
          if (current && current.id === previousId && current.ping === -1) {
            const online = store.servers.find((s) => s.ping !== undefined && s.ping >= 0);
            if (online) store.selectServer(online);
          }
        }, 5000);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (servers.length === 0) return;

    pingAllServers(servers);

    pingIntervalRef.current = setInterval(() => {
      pingAllServers(servers, true);
    }, 60_000);

    return () => {
      pingAbortRef.current = true;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, [servers.length]);

  useEffect(() => {
    if (servers.length === 0) {
      loadServers();
    }
  }, [servers.length]);

  function handleSelect(server: ServerInfo) {
    if (serverLocked) return;
    if (server.id !== selectedServer?.id) {
      selectServer(server);
    }
    setPage("main");
    if (server.ip) {
      pingServer(server.ip).then((ping) => {
        useServerStore.getState().updateServerPing(server.id, ping);
      }).catch(() => {});
    }
  }

  function handleAdd() {
    if (!newName || !newIp) return;
    addCustomServer({
      id: `custom-${Date.now()}`,
      name: newName,
      ip: newIp,
      category: "Custom",
    });
    setNewName("");
    setNewIp("");
    setShowAdd(false);
  }

  return (
    <aside className="w-[280px] shrink-0 bg-surface/40 border-r border-border/50 flex flex-col h-full">
      <div className="p-3 space-y-2">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search servers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border/50 bg-background/50 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-smooth"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted uppercase tracking-widest">
            Servers
            <span className="ml-1.5 text-muted-foreground font-mono">
              {filteredServers.length}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <Tooltip label={showAdd ? "Cancel" : "Add server"}>
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-smooth cursor-pointer"
              >
                {showAdd ? <X size={12} /> : <Plus size={12} />}
              </button>
            </Tooltip>
            <Tooltip label="Refresh">
              <button
                onClick={loadServers}
                disabled={isLoading}
                className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-smooth cursor-pointer disabled:opacity-40"
              >
                <RefreshCw
                  size={12}
                  className={isLoading ? "animate-spin" : ""}
                />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
      {showAdd && (
        <div className="px-3 pb-2">
          <div className="bg-background/50 border border-border/50 rounded-xl p-3 space-y-2">
            <input
              type="text"
              placeholder="Server name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-md border border-border/50 bg-background/50 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-smooth"
            />
            <input
              type="text"
              placeholder="http://server.example.com"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              className="w-full rounded-md border border-border/50 bg-background/50 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-smooth"
            />
            <div className="flex gap-1.5">
              <Button size="sm" onClick={handleAdd} className="flex-1 text-[11px]">
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAdd(false)}
                className="text-[11px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {isLoading && filteredServers.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <RefreshCw
              size={18}
              className="mx-auto mb-2 animate-spin text-primary"
            />
            <p className="text-[11px]">Loading servers...</p>
          </div>
        ) : filteredServers.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p className="text-[11px]">No servers found.</p>
          </div>
        ) : (
          filteredServers.map((server, index) => (
            <ServerListItem
              key={`${server.id}-${index}`}
              server={server}
              isSelected={selectedServer?.id === server.id}
              isDisabled={serverLocked || server.ping === -1 || (isLoggedIn && selectedServer?.id !== server.id)}
              onClick={() => handleSelect(server)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function ServerListItem({
  server,
  isSelected,
  isDisabled,
  onClick,
}: {
  server: ServerInfo;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={cn(
        "w-full text-left rounded-lg px-2.5 py-2 transition-smooth group",
        isDisabled && !isSelected
          ? "opacity-40 cursor-not-allowed border-l-2 border-transparent"
          : isSelected
            ? "bg-primary/10 border-l-2 border-primary cursor-pointer"
            : "hover:bg-surface-hover border-l-2 border-transparent cursor-pointer"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md bg-surface-hover/80 flex items-center justify-center shrink-0 overflow-hidden">
          {getServerIcon(server.id) || server.iconUrl ? (
            <img
              src={getServerIcon(server.id) || server.iconUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <Globe size={14} className="text-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-xs font-medium truncate",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {server.name}
            </span>
            {server.isOfficial && (
              <Shield size={10} className="text-primary shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted">
            {server.onlineCount !== undefined && (
              <span className="flex items-center gap-0.5 text-success/80">
                <Users size={9} />
                {server.onlineCount}
              </span>
            )}
            {server.category && <span>{server.category}</span>}
          </div>
        </div>
        {server.ping !== undefined && (
          <span
            className={cn(
              "inline-block w-2 h-2 rounded-full shrink-0",
              server.ping >= 0 ? "bg-success" : "bg-danger"
            )}
          />
        )}
      </div>
    </button>
  );
}
