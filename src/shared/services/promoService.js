import api from "@shared/services/api.instance.js";

export const promoService = {
  validate: (code, restaurantId, orderTotal = 0, isFirstOrder = false) =>
    api.post("/promos/validate", { code, restaurant_id: restaurantId, order_total: orderTotal, is_first_order: isFirstOrder }),
  create: (data) => api.post("/promos", data),
  list: (params = {}) => api.get("/promos", { params }),
  deactivate: (code) => api.delete(`/promos/${code}`),
};
