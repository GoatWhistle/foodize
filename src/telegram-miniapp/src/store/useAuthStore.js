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

      localStorage.setItem("foodize_tg_logged_out", "1");
      // Preserve the Telegram initData across logout so the "Войти через Telegram"
      // button still works: tg.initData is often empty on re-reads/reloads, and this
      // cache is the reliable source. It lives only for the webview session and the
      // backend re-validates its signature, so keeping it is safe.
      const savedInitData = sessionStorage.getItem(TELEGRAM_INIT_DATA_STORAGE_KEY);
      sessionStorage.clear();
      if (savedInitData) {
        sessionStorage.setItem(TELEGRAM_INIT_DATA_STORAGE_KEY, savedInitData);
      }

      set({ user: null, isAuthenticated: false });
    },
  }),
});
