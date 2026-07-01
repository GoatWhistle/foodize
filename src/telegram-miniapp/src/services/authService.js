import api from "./api";
import { createAuthService } from "@shared/services/authService.js";

export const authService = createAuthService({
  logout: () => {
    const refreshToken = sessionStorage.getItem("refresh_token");
    if (!refreshToken) return Promise.resolve();
    return api.post("/logout", null, {
      headers: {
        "X-Refresh-Token": refreshToken,
      },
    });
  },
});
