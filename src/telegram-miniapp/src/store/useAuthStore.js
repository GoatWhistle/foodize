import { createAuthStore } from "@shared/store/createAuthStore.js";
import { authService } from "../services/authService";
import { clearTelegramInitData } from "../telegram/sdk";

export const useAuthStore = createAuthStore({
  authService,
  tokenStorage: sessionStorage,
  persistKey: null,
  extraActions: (set, get) => ({
    setAuthenticated: (user) => set({ user, isAuthenticated: true }),

    logout: async () => {
      try {
        await authService.logout();
      } catch {}

      localStorage.setItem("foodize_tg_logged_out", "1");
      sessionStorage.clear();
      clearTelegramInitData();

      set({ user: null, isAuthenticated: false });
    },
  }),
});
