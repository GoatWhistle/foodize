import { createAuthStore, type AuthUser } from "@shared/store/createAuthStore";
import { authService } from "../services/authService";

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

      set({ user: null, isAuthenticated: false });
    },
  }),
});
