import { createAuthStore } from "@shared/store/createAuthStore.js";
import { authService } from "../services/authService";
import { TELEGRAM_INIT_DATA_STORAGE_KEY } from "../telegram/sdk";

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

      const telegramInitData = sessionStorage.getItem(TELEGRAM_INIT_DATA_STORAGE_KEY);
      localStorage.setItem("foodize_tg_logged_out", "1");
      sessionStorage.clear();
      if (telegramInitData) {
        sessionStorage.setItem(TELEGRAM_INIT_DATA_STORAGE_KEY, telegramInitData);
      }

      set({ user: null, isAuthenticated: false });
    },
  }),
});
