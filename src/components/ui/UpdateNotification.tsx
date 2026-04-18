"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Download, X, RefreshCw } from "lucide-react";
import { useUpdateStore } from "@/stores/updateStore";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";

interface UpdateInfo {
  version: string;
  exe: string;
  publishDate: string;
  productName: string;
}

export function UpdateNotification() {
  const {
    updateAvailable,
    updateInfo,
    checking,
    downloading,
    downloadProgress,
    setUpdateAvailable,
    setChecking,
    setDownloading,
    setDownloadProgress,
  } = useUpdateStore();

  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [iconAngle, setIconAngle] = useState(0);

  const MAX_SPEED = 0.5;
  const ACCEL_MS  = 500;
  const DECEL_MS  = 600;
  const rafRef         = useRef<number | null>(null);
  const phaseRef       = useRef<"idle"|"accel"|"steady"|"decel">("idle");
  const angleRef       = useRef(0);
  const phaseStartRef  = useRef(0);
  const decelStartRef  = useRef(0);
  const decelTargetRef = useRef(0);
  const pendingStop    = useRef(false);

  function startSpinLoop() {
    let last = performance.now();
    function tick(now: number) {
      const dt      = Math.min(now - last, 50);
      last          = now;
      const elapsed = now - phaseStartRef.current;

      switch (phaseRef.current) {
        case "accel": {
          const t = Math.min(elapsed / ACCEL_MS, 1);
          angleRef.current += MAX_SPEED * (t * t) * dt;
          if (t >= 1) {
            phaseRef.current    = "steady";
            phaseStartRef.current = now;
          }
          break;
        }
        case "steady": {
          angleRef.current += MAX_SPEED * dt;
          if (pendingStop.current) {
            pendingStop.current    = false;
            const decelDist        = MAX_SPEED * DECEL_MS / 2;
            decelStartRef.current  = angleRef.current;
            decelTargetRef.current = Math.ceil((angleRef.current + decelDist) / 360) * 360;
            phaseRef.current       = "decel";
            phaseStartRef.current  = now;
          }
          break;
        }
        case "decel": {
          const t        = Math.min(elapsed / DECEL_MS, 1);
          const progress = 1 - (1 - t) * (1 - t);
          angleRef.current =
            decelStartRef.current +
            (decelTargetRef.current - decelStartRef.current) * progress;
          if (t >= 1) {
            phaseRef.current = "idle";
            setIconAngle(0);
            setIsSpinning(false);
            return;
          }
          break;
        }
        default:
          return;
      }
      setIconAngle(angleRef.current % 360);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function triggerSpin() {
    if (phaseRef.current !== "idle") return;
    phaseRef.current      = "accel";
    phaseStartRef.current = performance.now();
    pendingStop.current   = false;
    setIsSpinning(true);
    startSpinLoop();
  }

  function triggerStop() {
    pendingStop.current = true;
  }

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  useEffect(() => {
    if (checking) {
      triggerSpin();
    } else {
      triggerStop();
    }
  }, [checking]);

  function openPopup() {
    setShowModal(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }

  function closePopup() {
    setVisible(false);
    setTimeout(() => setShowModal(false), 300);
  }

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;

    checkForUpdates();

    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function checkForUpdates() {
    if (checking || downloading) return;

    try {
      setChecking(true);
      setError(null);

      const result = await invoke<UpdateInfo | null>("check_for_updates");

      if (result) {
        setUpdateAvailable(true, result);
        setTimeout(() => openPopup(), 4000);
      } else {
        setUpdateAvailable(false, null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setChecking(false);
    }
  }

  async function handleDownloadAndInstall() {
    if (!updateInfo || downloading) return;

    try {
      setDownloading(true);
      setError(null);
      setDownloadProgress(0);

      const installerPath = await invoke<string>("download_update", {
        exeName: updateInfo.exe,
      });

      setDownloadProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 500));

      await invoke("install_update", { installerPath });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDownloading(false);
    }
  }

  if (!updateAvailable && !checking) {
  }

  return (
    <>
      <Tooltip label={checking ? "Checking for updates..." : updateAvailable ? `Update available: ${updateInfo?.version}` : "Check for updates"}>
        <button
          onClick={() => {
            if (updateAvailable) {
              showModal ? closePopup() : openPopup();
            } else if (!checking) {
              triggerSpin();
              setTimeout(() => checkForUpdates(), 2000);
            }
          }}
          className={cn(
            "relative p-2 rounded-md transition-colors",
            "hover:bg-white/10",
            isSpinning && "cursor-not-allowed",
            updateAvailable && !isSpinning && "animate-pulse-green"
          )}
          disabled={isSpinning}
        >
          <div className="relative w-4 h-4">
            <RefreshCw
              size={16}
              className="absolute inset-0 text-muted transition-opacity duration-300"
              style={{
                transform: `rotate(${iconAngle}deg)`,
                opacity: updateAvailable && !isSpinning ? 0 : 1,
              }}
            />
            <Download
              size={16}
              className="absolute inset-0 text-success transition-[opacity,transform] duration-300"
              style={{
                transform: `scale(${updateAvailable && !isSpinning ? 1 : 0.5})`,
                opacity: updateAvailable && !isSpinning ? 1 : 0,
              }}
            />
          </div>
        </button>
      </Tooltip>
      {showModal && updateInfo && createPortal(
        <div
          className="fixed top-16 right-4 w-80 bg-surface border border-border rounded-lg shadow-2xl z-[9999] transition-all duration-300"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.96)",
            pointerEvents: visible ? "auto" : "none",
          }}
        >
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Download size={16} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Update Available
                  </h3>
                  <p className="text-xs text-gray-400">
                    Version {updateInfo.version}
                  </p>
                </div>
              </div>
              <button
                onClick={closePopup}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>
            {error && (
              <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                {error}
              </div>
            )}
            {downloading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Downloading...</span>
                  <span className="text-white">{downloadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}
            {!downloading && (
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadAndInstall}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download size={12} />
                  Install
                </button>
                <button
                  onClick={closePopup}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium rounded-md transition-colors"
                >
                  Later
                </button>
              </div>
            )}

            <p className="text-[10px] text-gray-500 text-center leading-tight">
              Launcher will restart after installation
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

