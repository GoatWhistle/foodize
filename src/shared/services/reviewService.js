import api from "@shared/services/api.instance.js";

export const reviewService = {
  createReview: (restaurantId, data) =>
    api.post(`/restaurants/${restaurantId}/reviews`, data),
  deleteReview: (restaurantId, reviewId) =>
    api.delete(`/restaurants/${restaurantId}/reviews/${reviewId}`),
  updateMyReview: (restaurantId, data) =>
    api.put(`/restaurants/${restaurantId}/reviews/my`, data),
  getReviews: (restaurantId, params = {}) =>
    api.get(`/restaurants/${restaurantId}/reviews`, { params }),
  getRating: (restaurantId) => api.get(`/restaurants/${restaurantId}/rating`),
};
