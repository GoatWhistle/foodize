export const createCartService = (api) => ({
  getCart: () => api.get("/cart"),
  updateCart: (data) => api.post("/cart", data),
  clearCart: () => api.delete("/cart"),
});

export const createFavoriteService = (api) => ({
  getAll: (params) => api.get("/favorites", { params }),
  add: (restaurantId) => api.post(`/favorites/${restaurantId}`),
  remove: (restaurantId) => api.delete(`/favorites/${restaurantId}`),
});

export const createUserService = (api) => ({
  updateMe: (data) => api.patch("/users/me", data),
  changePassword: (data) => api.post("/users/me/change-password", data),
});

export const createMenuService = (api) => ({
  getRestaurantMenu: (restaurantId) =>
    api.get(`/restaurants/${restaurantId}/menu`),
  getMenuItem: (restaurantId, itemId) =>
    api.get(`/restaurants/${restaurantId}/menu/${itemId}`),
});

export const createRestaurantService = (api) => ({
  getRestaurants: (params) => api.get("/restaurants", { params }),
  getRestaurant: (id) => api.get(`/restaurants/${id}`),
});

export const createOrderService = (api) => ({
  createOrder: (data) => api.post("/orders", data),
  getMyOrders: (params) => api.get("/orders/my", { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
});

export const createReviewService = (api) => ({
  getRestaurantReviews: (restaurantId, params) =>
    api.get(`/restaurants/${restaurantId}/reviews`, { params }),
  createReview: (restaurantId, data) =>
    api.post(`/restaurants/${restaurantId}/reviews`, data),
  deleteReview: (restaurantId, reviewId) =>
    api.delete(`/restaurants/${restaurantId}/reviews/${reviewId}`),
});

export const createPromoService = (api) => ({
  validate: (code, restaurantId) =>
    api.post("/promos/validate", { code, restaurant_id: restaurantId }),
});
