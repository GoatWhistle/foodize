import api from "./api";

export const orderService = {
  create: (data) => api.post("/orders/", data),
  getMyOrders: (params) => api.get("/orders/me", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
  completeOrder: (id) => api.post(`/orders/${id}/complete`),
  getOrderEvents: (id) => api.get(`/orders/${id}/events`),
};
