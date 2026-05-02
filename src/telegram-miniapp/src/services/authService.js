import api from "./api";

export const authService = {
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
  getMe: () => api.get("/users/me"),
};
