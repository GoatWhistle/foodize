import api from "@shared/services/api.instance.js";

export const orderService = {
  create: (data, config = {}) => api.post("/orders/", data, {
    ...config,
    headers: { 'Idempotency-Key': crypto.randomUUID(), ...config.headers },
  }),
  getEstimate: (restaurantId) => api.get(`/orders/estimate/${restaurantId}`),
  getMyOrders: (params) => api.get("/orders/me", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  getByRestaurant: (restaurantId, params) =>
    api.get(`/orders/restaurant/${restaurantId}`, { params }),
  updateStatus: (id, status, data = {}) =>
    api.patch(`/orders/${id}/status`, { status, ...data }),
  completeOrder: (id) => api.post(`/orders/${id}/complete`),
  cancelOrder: (id, reason = null) => api.post(`/orders/${id}/cancel`, { reason }),
  getOrderEvents: (id) => api.get(`/orders/${id}/events`),
};
