import { create } from "zustand";

interface UpdateInfo {
  version: string;
  exe: string;
  publishDate: string;
  productName: string;
}

interface UpdateState {
  updateAvailable: boolean;
  updateInfo: UpdateInfo | null;
  checking: boolean;
  downloading: boolean;
  downloadProgress: number;
  setUpdateAvailable: (available: boolean, info: UpdateInfo | null) => void;
  setChecking: (checking: boolean) => void;
  setDownloading: (downloading: boolean) => void;
  setDownloadProgress: (progress: number) => void;
  reset: () => void;
}

export const useUpdateStore = create<UpdateState>((set) => ({
  updateAvailable: false,
  updateInfo: null,
  checking: false,
  downloading: false,
  downloadProgress: 0,
  setUpdateAvailable: (available, info) =>
    set({ updateAvailable: available, updateInfo: info }),
  setChecking: (checking) => set({ checking }),
  setDownloading: (downloading) => set({ downloading }),
  setDownloadProgress: (progress) => set({ downloadProgress: progress }),
  reset: () =>
    set({
      updateAvailable: false,
      updateInfo: null,
      checking: false,
      downloading: false,
      downloadProgress: 0,
    }),
}));
