/** Cross-cutting auth state (tokens + current user), persisted to localStorage.
 *
 * Lives in lib/ (not the auth feature) because the API client and any feature
 * needs read access to the access token. The raw tokens are the single source
 * of truth; React Query owns server data (the user profile) on top of it.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { User } from "@/features/auth/types";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: "ibc-auth" },
  ),
);
