import api from "./api";

export const reviewService = {
  createReview: (restaurantId, data) =>
    api.post(`/restaurants/${restaurantId}/reviews`, data),
  getReviews: (restaurantId) => api.get(`/restaurants/${restaurantId}/reviews`),
  getRating: (restaurantId) => api.get(`/restaurants/${restaurantId}/rating`),
};
