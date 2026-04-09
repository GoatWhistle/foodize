import api from "./api";

export const orderService = {
  create: (data) => api.post("/orders/", data),
  getMyOrders: () => api.get("/orders/me"),
  getById: (id) => api.get(`/orders/${id}`),
};
