import api from "@shared/services/api.instance";
import type {
  Order,
  OrderCreate,
  OrderEvent,
  OrderLoadEstimate,
  OrderStatus,
  OrderStatusUpdate,
  SuccessListResponse,
  SuccessResponse,
} from "@shared/types/models";

interface RequestConfig {
  headers?: Record<string, string>;
  [key: string]: unknown;
}

export const orderService = {
  create: (data: OrderCreate, config: RequestConfig = {}) =>
    api.post<SuccessResponse<Order>>("/orders/", data, {
      ...config,
      headers: { "Idempotency-Key": crypto.randomUUID(), ...config.headers },
    }),
  getEstimate: (restaurantId: string) =>
    api.get<SuccessResponse<OrderLoadEstimate>>(
      `/orders/estimate/${restaurantId}`,
    ),
  getMyOrders: (params?: Record<string, unknown>) =>
    api.get<SuccessListResponse<Order>>("/orders/me", { params }),
  getById: (id: string) => api.get<SuccessResponse<Order>>(`/orders/${id}`),
  getByRestaurant: (restaurantId: string, params?: Record<string, unknown>) =>
    api.get<SuccessListResponse<Order>>(`/orders/restaurant/${restaurantId}`, {
      params,
    }),
  updateStatus: (
    id: string,
    status: OrderStatus,
    data: Omit<OrderStatusUpdate, "status"> = {},
  ) =>
    api.patch<SuccessResponse<Order>>(`/orders/${id}/status`, {
      status,
      ...data,
    }),
  completeOrder: (id: string) =>
    api.post<SuccessResponse<Order>>(`/orders/${id}/complete`),
  cancelOrder: (id: string, reason: string | null = null) =>
    api.post<SuccessResponse<Order>>(`/orders/${id}/cancel`, { reason }),
  getOrderEvents: (id: string) =>
    api.get<SuccessListResponse<OrderEvent>>(`/orders/${id}/events`),
};
