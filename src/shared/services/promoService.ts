import api from "@shared/services/api.instance";
import type { components } from "@shared/types/api";
import type {
  Promo,
  PromoValidate,
  SuccessListResponse,
  SuccessResponse,
} from "@shared/types/models";

type PromoCreate = components["schemas"]["PromoCreate"];

export const promoService = {
  validate: (
    code: string,
    restaurantId: string,
    orderTotal = 0,
    isFirstOrder = false,
  ) =>
    api.post<SuccessResponse<PromoValidate>>("/promos/validate", {
      code,
      restaurant_id: restaurantId,
      order_total: orderTotal,
      is_first_order: isFirstOrder,
    }),
  create: (data: PromoCreate) => api.post<SuccessResponse<Promo>>("/promos", data),
  list: (params: Record<string, unknown> = {}) =>
    api.get<SuccessListResponse<Promo>>("/promos", { params }),
  deactivate: (code: string) =>
    api.delete<SuccessResponse<void>>(`/promos/${code}`),
};
