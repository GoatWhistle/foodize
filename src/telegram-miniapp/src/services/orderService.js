import api from "./api";

export const orderService = {
  create: (data, config = {}) => api.post("/orders/", data, config),
  getMyOrders: (params) => api.get("/orders/me", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  completeOrder: (id) => api.post(`/orders/${id}/complete`),
  cancelOrder: (id, reason = null) =>
    api.post(`/orders/${id}/cancel`, { reason }),
  getOrderEvents: (id) => api.get(`/orders/${id}/events`),
};
