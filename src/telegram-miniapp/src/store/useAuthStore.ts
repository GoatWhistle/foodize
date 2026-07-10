import { createAuthStore, type AuthUser } from "@shared/store/createAuthStore";
import { authService } from "../services/authService";
import { TELEGRAM_INIT_DATA_STORAGE_KEY } from "../telegram/sdk";

export const useAuthStore = createAuthStore({
  authService,
  persistKey: null,
  extraActions: (set) => ({
    setAuthenticated: (user: AuthUser) =>
      set({ user, isAuthenticated: true }),

    logout: async () => {
      try {
        await authService.logout();
      } catch {}

      localStorage.setItem("foodize_tg_logged_out", "1");
      const savedInitData = sessionStorage.getItem(
        TELEGRAM_INIT_DATA_STORAGE_KEY,
      );
      sessionStorage.clear();
      if (savedInitData) {
        sessionStorage.setItem(TELEGRAM_INIT_DATA_STORAGE_KEY, savedInitData);
      }

      set({ user: null, isAuthenticated: false });
    },
  }),
});
