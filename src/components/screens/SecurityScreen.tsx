"use client";

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FolderOpen,
  Flame,
  Bug,
} from "lucide-react";

type ItemStatus = "scanning" | "ok" | "missing" | "error" | "unknown";

interface RowState {
  launcher: ItemStatus;
  game: ItemStatus;
}

type SectionStatus = "ok" | "missing" | "error" | "scanning" | "unknown";

export function SecurityScreen() {
  const { settings } = useSettingsStore();
  const gamePath = settings.installationDirectory ?? "";

  const [isScanning, setIsScanning] = useState(false);

  const [firewallApiOk, setFirewallApiOk] = useState<boolean | null>(null);
  const [firewallRows, setFirewallRows] = useState<RowState>({ launcher: "unknown", game: "unknown" });
  const [isAddingFwLauncher, setIsAddingFwLauncher] = useState(false);
  const [isAddingFwGame, setIsAddingFwGame] = useState(false);
  const [isRemovingFwLauncher, setIsRemovingFwLauncher] = useState(false);
  const [isRemovingFwGame, setIsRemovingFwGame] = useState(false);

  const [defenderApiOk, setDefenderApiOk] = useState<boolean | null>(null);
  const [defenderRows, setDefenderRows] = useState<RowState>({ launcher: "unknown", game: "unknown" });
  const [isAddingDefLauncher, setIsAddingDefLauncher] = useState(false);
  const [isAddingDefGame, setIsAddingDefGame] = useState(false);
  const [isRemovingDefLauncher, setIsRemovingDefLauncher] = useState(false);
  const [isRemovingDefGame, setIsRemovingDefGame] = useState(false);

  const [permRows, setPermRows] = useState<RowState>({ launcher: "unknown", game: "unknown" });
  const [isFixingPermLauncher, setIsFixingPermLauncher] = useState(false);
  const [isFixingPermGame, setIsFixingPermGame] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  async function runAllChecks() {
    setIsScanning(true);
    setFirewallRows({ launcher: "scanning", game: "scanning" });
    setDefenderRows({ launcher: "scanning", game: "scanning" });
    setPermRows({ launcher: "scanning", game: "scanning" });

    await Promise.allSettled([
      (async () => {
        try {
          await invoke("check_firewall_api");
          setFirewallApiOk(true);
          const r = await invoke<{ has_launcher: boolean; has_game: boolean }>("check_firewall_rules");
          setFirewallRows({
            launcher: r.has_launcher ? "ok" : "missing",
            game: r.has_game ? "ok" : "missing",
          });
        } catch {
          setFirewallApiOk(false);
          setFirewallRows({ launcher: "error", game: "error" });
        }
      })(),
      (async () => {
        try {
          await invoke("check_defender_api");
          setDefenderApiOk(true);
          const r = await invoke<{ has_launcher: boolean; has_game: boolean }>(
            "check_defender_exclusions",
            { gamePath }
          );
          setDefenderRows({
            launcher: r.has_launcher ? "ok" : "missing",
            game: r.has_game ? "ok" : "missing",
          });
        } catch {
          setDefenderApiOk(false);
          setDefenderRows({ launcher: "error", game: "error" });
        }
      })(),
      (async () => {
        try {
          const r = await invoke<{ launcher_ok: boolean; game_ok: boolean }>(
            "check_folder_permissions",
            { gamePath }
          );
          setPermRows({
            launcher: r.launcher_ok ? "ok" : "missing",
            game: r.game_ok ? "ok" : "missing",
          });
        } catch {
          setPermRows({ launcher: "error", game: "error" });
        }
      })(),
    ]);

    setIsScanning(false);
  }

  useEffect(() => {
    runAllChecks();
  }, [gamePath]);

  async function addFwLauncher() {
    setIsAddingFwLauncher(true);
    try {
      await invoke("add_firewall_rules", { gamePath, which: "launcher" });
      setFirewallRows(r => ({ ...r, launcher: "ok" }));
    } catch { setFirewallRows(r => ({ ...r, launcher: "error" })); }
    finally { setIsAddingFwLauncher(false); }
  }

  async function addFwGame() {
    setIsAddingFwGame(true);
    try {
      await invoke("add_firewall_rules", { gamePath, which: "game" });
      setFirewallRows(r => ({ ...r, game: "ok" }));
    } catch { setFirewallRows(r => ({ ...r, game: "error" })); }
    finally { setIsAddingFwGame(false); }
  }

  function confirmRemoveFw(which: "launcher" | "game") {
    setConfirmDialog({
      open: true,
      title: "Remove Firewall Rule",
      message: `Remove the ${which} firewall rule? It will no longer have network access through the firewall.`,
      onConfirm: async () => {
        setConfirmDialog(d => ({ ...d, open: false }));
        if (which === "launcher") {
          setIsRemovingFwLauncher(true);
          try {
            await invoke("remove_firewall_rules", { which: "launcher" });
            setFirewallRows(r => ({ ...r, launcher: "missing" }));
          } catch { setFirewallRows(r => ({ ...r, launcher: "error" })); }
          finally { setIsRemovingFwLauncher(false); }
        } else {
          setIsRemovingFwGame(true);
          try {
            await invoke("remove_firewall_rules", { which: "game" });
            setFirewallRows(r => ({ ...r, game: "missing" }));
          } catch { setFirewallRows(r => ({ ...r, game: "error" })); }
          finally { setIsRemovingFwGame(false); }
        }
      },
    });
  }

  async function addDefLauncher() {
    setIsAddingDefLauncher(true);
    try {
      await invoke("add_defender_exclusions", { gamePath, which: "launcher" });
      setDefenderRows(r => ({ ...r, launcher: "ok" }));
    } catch { setDefenderRows(r => ({ ...r, launcher: "error" })); }
    finally { setIsAddingDefLauncher(false); }
  }

  async function addDefGame() {
    setIsAddingDefGame(true);
    try {
      await invoke("add_defender_exclusions", { gamePath, which: "game" });
      setDefenderRows(r => ({ ...r, game: "ok" }));
    } catch { setDefenderRows(r => ({ ...r, game: "error" })); }
    finally { setIsAddingDefGame(false); }
  }

  function confirmRemoveDef(which: "launcher" | "game") {
    setConfirmDialog({
      open: true,
      title: "Remove Defender Exclusion",
      message: `Remove the ${which} exclusion from Windows Defender? It may be scanned or quarantined.`,
      onConfirm: async () => {
        setConfirmDialog(d => ({ ...d, open: false }));
        if (which === "launcher") {
          setIsRemovingDefLauncher(true);
          try {
            await invoke("remove_defender_exclusions", { gamePath, which: "launcher" });
            setDefenderRows(r => ({ ...r, launcher: "missing" }));
          } catch { setDefenderRows(r => ({ ...r, launcher: "error" })); }
          finally { setIsRemovingDefLauncher(false); }
        } else {
          setIsRemovingDefGame(true);
          try {
            await invoke("remove_defender_exclusions", { gamePath, which: "game" });
            setDefenderRows(r => ({ ...r, game: "missing" }));
          } catch { setDefenderRows(r => ({ ...r, game: "error" })); }
          finally { setIsRemovingDefGame(false); }
        }
      },
    });
  }

  async function fixPermLauncher() {
    setIsFixingPermLauncher(true);
    try {
      await invoke("fix_folder_permissions", { gamePath: "" });
      setPermRows(r => ({ ...r, launcher: "ok" }));
    } catch { setPermRows(r => ({ ...r, launcher: "error" })); }
    finally { setIsFixingPermLauncher(false); }
  }

  async function fixPermGame() {
    setIsFixingPermGame(true);
    try {
      await invoke("fix_folder_permissions", { gamePath });
      setPermRows(r => ({ ...r, game: "ok" }));
    } catch { setPermRows(r => ({ ...r, game: "error" })); }
    finally { setIsFixingPermGame(false); }
  }

  function sectionStatus(rows: RowState): SectionStatus {
    if (rows.launcher === "scanning" || rows.game === "scanning") return "scanning";
    if (rows.launcher === "error" || rows.game === "error") return "error";
    if (rows.launcher === "unknown" && rows.game === "unknown") return "unknown";
    if (rows.launcher === "ok" && rows.game === "ok") return "ok";
    return "missing";
  }

  function SectionIcon({ status }: { status: SectionStatus }) {
    switch (status) {
      case "ok":       return <ShieldCheck size={18} className="text-success shrink-0" />;
      case "missing":  return <ShieldAlert  size={18} className="text-warning shrink-0" />;
      case "error":    return <ShieldOff    size={18} className="text-danger  shrink-0" />;
      case "scanning": return <Shield       size={18} className="text-primary animate-pulse shrink-0" />;
      default:         return <Shield       size={18} className="text-muted   shrink-0" />;
    }
  }

  function StatusBadge({ status }: { status: ItemStatus }) {
    switch (status) {
      case "scanning": return (
        <span className="flex items-center gap-1 text-[11px] text-primary whitespace-nowrap">
          <Loader2 size={11} className="animate-spin" /> Scanning...
        </span>
      );
      case "ok": return (
        <span className="flex items-center gap-1 text-[11px] text-success whitespace-nowrap">
          <CheckCircle2 size={11} /> Protected
        </span>
      );
      case "missing": return (
        <span className="flex items-center gap-1 text-[11px] text-warning whitespace-nowrap">
          <AlertCircle size={11} /> Missing
        </span>
      );
      case "error": return (
        <span className="flex items-center gap-1 text-[11px] text-danger whitespace-nowrap">
          <XCircle size={11} /> Error
        </span>
      );
      default: return <span className="text-[11px] text-muted">-</span>;
    }
  }

  function ItemRow({
    icon, name, detail, status,
    addLabel, onAdd, isAdding,
    onRemove, isRemoving,
    canRemove = true,
  }: {
    icon: React.ReactNode;
    name: string;
    detail?: string;
    status: ItemStatus;
    addLabel: string;
    onAdd: () => void;
    isAdding: boolean;
    onRemove: () => void;
    isRemoving: boolean;
    canRemove?: boolean;
  }) {
    const busy = status === "scanning";
    return (
      <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
        <div className="shrink-0 text-muted">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium leading-tight">{name}</p>
            <StatusBadge status={status} />
          </div>
          {detail && <p className="text-[10px] text-muted truncate mt-0.5">{detail}</p>}
        </div>
        <div className="shrink-0 ml-2 w-20 flex justify-end">
          {status !== "ok" && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAdd}
              isLoading={isAdding}
              disabled={busy || isRemoving}
              className="h-7 px-3 text-[11px] w-full"
            >
              {addLabel}
            </Button>
          )}
          {status === "ok" && canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              isLoading={isRemoving}
              disabled={busy || isAdding}
              className="h-7 px-3 text-[11px] w-full text-muted hover:text-danger"
            >
              <XCircle size={12} className="mr-1" />
              Remove
            </Button>
          )}
          {status === "ok" && !canRemove && (
            <CheckCircle2 size={16} className="text-success mx-auto" />
          )}
        </div>
      </div>
    );
  }

  const fwStatus   = sectionStatus(firewallRows);
  const defStatus  = sectionStatus(defenderRows);
  const permStatus = sectionStatus(permRows);
  const allOk = fwStatus === "ok" && defStatus === "ok" && permStatus === "ok";
  const anyScanning = fwStatus === "scanning" || defStatus === "scanning" || permStatus === "scanning";

  return (
    <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">Security Center</h1>
          <p className="text-[11px] text-muted mt-0.5">
            Windows Firewall &middot; Defender &middot; Folder Permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!anyScanning && (
            <span className={`flex items-center gap-1.5 text-[11px] font-medium ${allOk ? "text-success" : "text-warning"}`}>
              {allOk
                ? <><ShieldCheck size={13} /> All protected</>
                : <><ShieldAlert size={13} /> Attention needed</>}
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={runAllChecks}
            isLoading={isScanning}
            className="gap-1.5"
          >
            <RefreshCw size={12} />
            Re-scan
          </Button>
        </div>
      </div>
      <div className="w-full">
      <div className="grid grid-cols-3 gap-3 w-full">
        <section className="border border-border rounded-xl bg-surface overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/50">
            <SectionIcon status={fwStatus} />
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-bold tracking-wide uppercase truncate">Windows Firewall</h2>
              <p className="text-[10px] text-muted truncate">Network access rules</p>
            </div>
            {firewallApiOk === false && (
              <span className="text-[10px] text-danger border border-danger/30 rounded px-1.5 py-0.5 shrink-0">
                N/A
              </span>
            )}
          </div>
          <div className="px-4">
            <ItemRow
              icon={<Flame size={13} />}
              name="Launcher"
              detail="Connection to game servers"
              status={firewallRows.launcher}
              addLabel="Add"
              onAdd={addFwLauncher}
              isAdding={isAddingFwLauncher}
              onRemove={() => confirmRemoveFw("launcher")}
              isRemoving={isRemovingFwLauncher}
            />
            <ItemRow
              icon={<Flame size={13} />}
              name="Game"
              detail="nfsw.exe"
              status={firewallRows.game}
              addLabel="Add"
              onAdd={addFwGame}
              isAdding={isAddingFwGame}
              onRemove={() => confirmRemoveFw("game")}
              isRemoving={isRemovingFwGame}
            />
          </div>
        </section>
        <section className="border border-border rounded-xl bg-surface overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/50">
            <SectionIcon status={defStatus} />
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-bold tracking-wide uppercase truncate">Windows Defender</h2>
              <p className="text-[10px] text-muted truncate">Antivirus exclusions</p>
            </div>
            {defenderApiOk === false && (
              <span className="text-[10px] text-danger border border-danger/30 rounded px-1.5 py-0.5 shrink-0">
                N/A
              </span>
            )}
          </div>
          <div className="px-4">
            <ItemRow
              icon={<Bug size={13} />}
              name="Launcher"
              detail="Launcher folder exclusion"
              status={defenderRows.launcher}
              addLabel="Exclude"
              onAdd={addDefLauncher}
              isAdding={isAddingDefLauncher}
              onRemove={() => confirmRemoveDef("launcher")}
              isRemoving={isRemovingDefLauncher}
            />
            <ItemRow
              icon={<Bug size={13} />}
              name="Game"
              detail="Game folder exclusion"
              status={defenderRows.game}
              addLabel="Exclude"
              onAdd={addDefGame}
              isAdding={isAddingDefGame}
              onRemove={() => confirmRemoveDef("game")}
              isRemoving={isRemovingDefGame}
            />
          </div>
        </section>
        <section className="border border-border rounded-xl bg-surface overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/50">
            <SectionIcon status={permStatus} />
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-bold tracking-wide uppercase truncate">Folder Permissions</h2>
              <p className="text-[10px] text-muted truncate">Write access</p>
            </div>
          </div>
          <div className="px-4">
            <ItemRow
              icon={<FolderOpen size={13} />}
              name="Launcher"
              detail="Updates &amp; configuration"
              status={permRows.launcher}
              addLabel="Fix"
              onAdd={fixPermLauncher}
              isAdding={isFixingPermLauncher}
              onRemove={() => {}}
              isRemoving={false}
              canRemove={false}
            />
            <ItemRow
              icon={<FolderOpen size={13} />}
              name="Game"
              detail={gamePath || "Set game path in settings"}
              status={permRows.game}
              addLabel="Fix"
              onAdd={fixPermGame}
              isAdding={isFixingPermGame}
              onRemove={() => {}}
              isRemoving={false}
              canRemove={false}
            />
          </div>
        </section>

      </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog(d => ({ ...d, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Remove"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
}
