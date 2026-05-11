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

  logout: async () => {
    try {
      await authService.telegramLogout();
      localStorage.setItem("foodize_tg_logged_out", "1");
    } catch {}
    sessionStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
