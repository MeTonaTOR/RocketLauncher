import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ServerCredentials {
  email: string;
  password: string;
}

interface CredentialsState {
  credentials: Record<string, ServerCredentials>;
  saveCredentials: (serverId: string, email: string, password: string) => void;
  getCredentials: (serverId: string) => ServerCredentials | null;
  clearCredentials: (serverId: string) => void;
  clearAllCredentials: () => void;
}

export const useCredentialsStore = create<CredentialsState>()(
  persist(
    (set, get) => ({
      credentials: {},
      saveCredentials: (serverId, email, password) =>
        set((state) => ({
          credentials: {
            ...state.credentials,
            [serverId]: { email, password },
          },
        })),
      getCredentials: (serverId) => {
        const state = get();
        return state.credentials[serverId] || null;
      },
      clearCredentials: (serverId) =>
        set((state) => {
          const newCredentials = { ...state.credentials };
          delete newCredentials[serverId];
          return { credentials: newCredentials };
        }),
      clearAllCredentials: () => set({ credentials: {} }),
    }),
    {
      name: "launcher-credentials",
      version: 1,
    }
  )
);
