import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PlaytimeState {
  playtime: Record<string, number>;
  addSeconds: (serverId: string, seconds: number) => void;
  getSeconds: (serverId: string) => number;
}

export const usePlaytimeStore = create<PlaytimeState>()(
  persist(
    (set, get) => ({
      playtime: {},
      addSeconds: (serverId, seconds) =>
        set((state) => ({
          playtime: {
            ...state.playtime,
            [serverId]: (state.playtime[serverId] ?? 0) + seconds,
          },
        })),
      getSeconds: (serverId) => get().playtime[serverId] ?? 0,
    }),
    { name: "launcher-playtime" }
  )
);

export function formatPlaytime(seconds: number): string {
  if (seconds === 0) return "0 hrs";
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} mins`;
  const hrs = (seconds / 3600).toFixed(1);
  return `${hrs} hrs`;
}
