import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LauncherSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/config";

interface SettingsState {
  settings: LauncherSettings;
  setSettings: (partial: Partial<LauncherSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      setSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "launcher-settings",
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { settings?: LauncherSettings };
        if (version === 0 && state?.settings?.selectedCDN === "https://files.worldunited.gg") {
          state.settings.selectedCDN = DEFAULT_SETTINGS.selectedCDN;
        }
        return state as SettingsState;
      },
    }
  )
);
