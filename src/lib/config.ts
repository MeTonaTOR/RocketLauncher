import type { LauncherSettings } from "./types";
import { getVersion } from "@tauri-apps/api/app";

export const APP_NAME = "RocketLauncher";

let cachedVersion: string | null = null;

export async function getAppVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion;
  try {
    cachedVersion = await getVersion();
    return cachedVersion;
  } catch (error) {
    console.error("Failed to get app version:", error);
    return "Unknown";
  }
}

// Fallback for synchronous access (shouldn't be needed in most cases)
export const APP_VERSION = "1.2.0";

export const DEFAULT_SETTINGS: LauncherSettings = {
  installationDirectory: "",
  selectedCDN: "https://cdn.worldunited.gg",
  language: "EN",
  disableProxy: false,
  disableRPC: false,
  streamingSupport: false,
  themeSupport: false,
  insider: false,
  ignoreUpdateVersion: "",
  firewallStatus: "not_checked",
  defenderStatus: "not_checked",
  closeOnGameExit: false,
  disableSlideshow: false,
};

export const DOWNLOAD_CONFIG = {
  maxThreads: 3,
  chunkCount: 16,
  retryAttempts: 3,
  retryDelay: 2000,
};
