import api from "./api";

export const restaurantService = {
  getAll: () => api.get("/restaurants/"),
  getMy: () => api.get("/restaurants/"),
  create: (data) => api.post("/restaurants/", data),
  update: (id, data) => api.patch(`/restaurants/${id}`, data),
};
