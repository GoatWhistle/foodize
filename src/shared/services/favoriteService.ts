import { api } from "@shared/services/api.instance";
import type {
  Favorite,
  SuccessListResponse,
  SuccessResponse,
} from "@shared/types/models";

export const favoriteService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<SuccessListResponse<Favorite>>("/favorites", { params }),
  add: (restaurantId: string) =>
    api.post<SuccessResponse<Favorite>>(`/favorites/${restaurantId}`),
  remove: (restaurantId: string) =>
    api.delete<SuccessResponse<void>>(`/favorites/${restaurantId}`),
};
