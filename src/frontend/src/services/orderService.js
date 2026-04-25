import api from "./api";

export const orderService = {
  create: (data) => api.post("/orders/", data),
  getMyOrders: (config) => api.get("/orders/me", config),
  getById: (id) => api.get(`/orders/${id}`),
  getByRestaurant: (restaurantId, params) =>
    api.get(`/orders/restaurant/${restaurantId}`, { params }),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
  completeOrder: (id) => api.post(`/orders/${id}/complete`),
  getOrderEvents: (id) => api.get(`/orders/${id}/events`),
};
