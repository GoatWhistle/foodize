import api from "@shared/services/api.instance.js";

export const userService = {
  getById: (userId) => api.get(`/users/${userId}`),
  updateMe: (data) => api.patch("/users/me", data),
  changePassword: (data) => api.post("/users/me/change-password", data),
};
