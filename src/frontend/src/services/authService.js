import api from "./api";

export const authService = {
  register: (data) => api.post("/register", data),
  login: (data) => api.post("/login", data),
  getMe: () => api.get("/users/"),
  logout: () => Promise.resolve(), // backend uses cookie expiry, clear locally
};
