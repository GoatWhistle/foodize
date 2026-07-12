import { createAuthStore, type AuthUser } from "@shared/store/createAuthStore";
import { authService } from "../services/authService";

export const useAuthStore = createAuthStore({
  authService,
  persistKey: null,
  onLogout: () => {
    localStorage.setItem("foodize_tg_logged_out", "1");
  },
  extraActions: (set) => ({
    setAuthenticated: (user: AuthUser) => { set({ user }); },
  }),
});
