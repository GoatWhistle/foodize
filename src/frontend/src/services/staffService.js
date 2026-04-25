import api from "./api";

export const staffService = {
  createRequest: (restaurantId, data) =>
    api.post(`/staff/requests/${restaurantId}`, data),

  getMyProfile: () => api.get("/staff/me"),
  getMyApplication: () => api.get("/staff/my-application"),

  getRestaurantOrders: (restaurantId, params = {}) =>
    api.get(`/orders/restaurant/${restaurantId}`, { params }),

  updateOrderStatus: (orderId, status) =>
    api.patch(`/orders/${orderId}/status`, { status }),
};
