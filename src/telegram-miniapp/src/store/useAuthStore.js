import { create } from "zustand";
import { authService } from "../services/authService";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  setAuthenticated: (user) => set({ user, isAuthenticated: true }),

  fetchMe: async () => {
    try {
      const resp = await authService.getMe();
      set({ user: resp.data.data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  logout: () => {
    sessionStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
