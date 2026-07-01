import api from "@shared/services/api.instance.js";

export function createAuthService({ logout } = {}) {
  return {
    register: (data) => api.post("/register", data),
    login: (data) => api.post("/login", data),
    getMe: () => api.get("/users/me"),
    logout: logout ?? (() => api.post("/logout")),

    requestTelegramLoginCode: (data) =>
      api.post("/telegram/site-login/request-code", data),
    requestTelegramLoginCodeByUsername: (data) =>
      api.post("/telegram/site-login/request-code-by-username", data),
    verifyTelegramLoginCode: (data) =>
      api.post("/telegram/site-login/verify", data),
    verifyTelegramLoginCodeByUsername: (data) =>
      api.post("/telegram/site-login/verify-by-username", data),
    setTelegramSitePassword: (data) =>
      api.post("/telegram/site-login/password", data),
    telegramLogout: () => api.post("/telegram/logout"),

    telegramCheck: (initData) =>
      api.post("/telegram/check", { init_data: initData }),
    telegramRegister: (initData, phoneNumber, name) =>
      api.post("/telegram/register", {
        init_data: initData,
        phone_number: phoneNumber,
        name,
      }),
    telegramAuth: (initData) =>
      api.post("/telegram/auth", { init_data: initData }),
  };
}

export const authService = createAuthService();
