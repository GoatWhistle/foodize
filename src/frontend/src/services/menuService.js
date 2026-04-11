import api from "./api";

export const menuService = {
  getMenu: (restaurantId) => api.get(`/menu/${restaurantId}`),
  addItem: (restaurantId, data) =>
    api.post(`/menu/${restaurantId}/items`, data),
};
