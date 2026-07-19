import { api } from "./api";
import { createAuthService } from "@shared/services/authService";

export const authService = createAuthService({
  logout: () => api.post("/telegram/session-logout"),
});
