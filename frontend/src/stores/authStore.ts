import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import api from "@/lib/api";

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
    // Check if there's an active Supabase session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      set({ user: null, isAuthenticated: false, isInitializing: false });
      return;
    }

    // Fetch the user's app-specific profile from the FastAPI backend
    try {
      const { data } = await api.get<User>("/api/auth/me");
      set({ user: data, isAuthenticated: true, isInitializing: false });
    } catch {
      set({ user: null, isAuthenticated: false, isInitializing: false });
    }

    // Listen for session changes (login, logout, token refresh, etc.)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        set({ user: null, isAuthenticated: false });
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        try {
          const { data } = await api.get<User>("/api/auth/me");
          set({ user: data, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      }
    });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  logout: async () => {
    await supabase.auth.signOut();
    // onAuthStateChange SIGNED_OUT event will clear state automatically
    set({ user: null, isAuthenticated: false });
  },
}));
