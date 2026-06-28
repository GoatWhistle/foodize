import api from "@shared/services/api.instance.js";

export const favoriteService = {
  getAll: (params) => api.get("/favorites", { params }),
  add: (restaurantId) => api.post(`/favorites/${restaurantId}`),
  remove: (restaurantId) => api.delete(`/favorites/${restaurantId}`),
};
