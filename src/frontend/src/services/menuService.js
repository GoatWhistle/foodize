import api from "./api";

export const menuService = {
  getMenu: (restaurantId) => api.get(`/menu/${restaurantId}`),
  addItem: (restaurantId, data) =>
    api.post(`/menu/${restaurantId}/items`, data),
  updateItem: (restaurantId, itemId, data) =>
    api.patch(`/menu/${restaurantId}/items/${itemId}`, data),
  deleteItem: (restaurantId, itemId) =>
    api.delete(`/menu/${restaurantId}/items/${itemId}`),
};
