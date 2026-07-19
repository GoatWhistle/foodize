import { api } from "@shared/services/api.instance";
import type { Cart, CartUpdate, SuccessResponse } from "@shared/types/models";

export const cartService = {
  getCart: () => api.get<SuccessResponse<Cart>>("/cart"),
  updateCart: (data: CartUpdate) =>
    api.post<SuccessResponse<Cart>>("/cart", data),
  clearCart: () => api.delete<SuccessResponse<Cart>>("/cart"),
};
