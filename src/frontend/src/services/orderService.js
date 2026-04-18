import api from "./api";

export const orderService = {
  create: (data) => api.post("/orders/", data),
  getMyOrders: () => api.get("/orders/me"),
  getById: (id) => api.get(`/orders/${id}`),
  getByRestaurant: (restaurantId, params) => 
    api.get(`/orders/restaurant/${restaurantId}`, { params }),
  updateStatus: (id, status) => 
    api.patch(`/orders/${id}/status`, { status }),
};
