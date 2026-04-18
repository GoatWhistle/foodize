import api from "./api";

export const restaurantService = {
  getAll: (params) => api.get("/restaurants/public", { params }),
  getMy: () => api.get("/restaurants/"),
  create: (data) => api.post("/restaurants/", data),
  update: (id, data) => api.patch(`/restaurants/${id}`, data),
};
