import { create } from "zustand";
import type { DownloadProgress, VerifyHashProgress, LauncherPage } from "@/lib/types";

interface LauncherState {
  currentPage: LauncherPage;
  setPage: (page: LauncherPage) => void;

  isLoggedIn: boolean;
  userEmail: string;
  loginToken: string;
  userId: string;
  setAuth: (email: string, token: string, userId: string) => void;
  logout: () => void;

  downloadProgress: DownloadProgress;
  setDownloadProgress: (progress: Partial<DownloadProgress>) => void;

  verifyProgress: VerifyHashProgress;
  setVerifyProgress: (progress: Partial<VerifyHashProgress>) => void;

  isGameRunning: boolean;
  gameStatus: "idle" | "launching" | "running";
  setGameRunning: (running: boolean) => void;
  setGameStatus: (status: "idle" | "launching" | "running") => void;

  showUpdatePopup: boolean;
  setShowUpdatePopup: (show: boolean) => void;

  isInitialized: boolean;
  setInitialized: (init: boolean) => void;

  isAutoVerifying: boolean;
  setAutoVerifying: (v: boolean) => void;
}

export const useLauncherStore = create<LauncherState>()((set) => ({
  currentPage: "splash",
  setPage: (page) => set({ currentPage: page }),

  isLoggedIn: false,
  userEmail: "",
  loginToken: "",
  userId: "",
  setAuth: (email, token, userId) =>
    set({ isLoggedIn: true, userEmail: email, loginToken: token, userId }),
  logout: () =>
    set({ isLoggedIn: false, userEmail: "", loginToken: "", userId: "" }),

  downloadProgress: {
    fileName: "",
    currentFile: 0,
    totalFiles: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    speed: 0,
    status: "idle",
  },
  setDownloadProgress: (progress) =>
    set((state) => ({
      downloadProgress: { ...state.downloadProgress, ...progress },
    })),

  verifyProgress: {
    currentFile: "",
    currentIndex: 0,
    totalFiles: 0,
    corruptedFiles: [],
    status: "idle",
  },
  setVerifyProgress: (progress) =>
    set((state) => ({
      verifyProgress: { ...state.verifyProgress, ...progress },
    })),

  isGameRunning: false,
  gameStatus: "idle",
  setGameRunning: (running) => set({ isGameRunning: running, gameStatus: running ? "running" : "idle" }),
  setGameStatus: (status) => set({ gameStatus: status, isGameRunning: status !== "idle" }),

  showUpdatePopup: false,
  setShowUpdatePopup: (show) => set({ showUpdatePopup: show }),

  isInitialized: false,
  setInitialized: (init) => set({ isInitialized: init }),

  isAutoVerifying: false,
  setAutoVerifying: (v) => set({ isAutoVerifying: v }),
}));
