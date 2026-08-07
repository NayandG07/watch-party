import { create } from "zustand";
import api, { tokenStorage } from "@/lib/api";

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  initialize: async () => {
    try {
      if (!tokenStorage.get()) {
        set({ user: null, isAuthenticated: false, isInitializing: false });
        return;
      }
      const { data } = await api.get<User>("/api/auth/me");
      set({ user: data, isAuthenticated: true, isInitializing: false });
    } catch {
      tokenStorage.clear();
      set({ user: null, isAuthenticated: false, isInitializing: false });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  logout: async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      tokenStorage.clear();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
