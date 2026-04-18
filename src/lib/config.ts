import type { LauncherSettings } from "./types";

export const APP_NAME = "RocketLauncher";
export const APP_VERSION = "1.0.0";

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
