import { api } from "@shared/services/api.instance";
import type {
  Rating,
  Review,
  ReviewCreate,
  SuccessListResponse,
  SuccessResponse,
} from "@shared/types/models";

export const reviewService = {
  createReview: (restaurantId: string, data: ReviewCreate) =>
    api.post<SuccessResponse<Review>>(`/restaurants/${restaurantId}/reviews`, data),
  deleteReview: (restaurantId: string, reviewId: string) =>
    api.delete<SuccessResponse<void>>(
      `/restaurants/${restaurantId}/reviews/${reviewId}`,
    ),
  updateMyReview: (restaurantId: string, data: ReviewCreate) =>
    api.put<SuccessResponse<Review>>(
      `/restaurants/${restaurantId}/reviews/my`,
      data,
    ),
  getReviews: (restaurantId: string, params: Record<string, unknown> = {}) =>
    api.get<SuccessListResponse<Review>>(
      `/restaurants/${restaurantId}/reviews`,
      { params },
    ),
  getRating: (restaurantId: string) =>
    api.get<SuccessResponse<Rating>>(`/restaurants/${restaurantId}/rating`),
};
