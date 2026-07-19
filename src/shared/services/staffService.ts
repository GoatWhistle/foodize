import { api } from "@shared/services/api.instance";
import { orderService } from "@shared/services/orderService";
import type { components } from "@shared/types/api";
import type {
  MenuItem,
  OrderStatus,
  OrderStatusUpdate,
  StaffProfile,
  StaffRequest,
  SuccessListResponse,
  SuccessResponse,
} from "@shared/types/models";

type StaffRequestCreate = components["schemas"]["StaffRequestCreate"];

export const staffService = {
  createRequest: (restaurantId: string, data: StaffRequestCreate) =>
    api.post<SuccessResponse<StaffRequest>>(
      `/staff/requests/${restaurantId}`,
      data,
    ),
  getMyProfile: () => api.get<SuccessResponse<StaffProfile>>("/staff/me"),
  getMyApplication: () =>
    api.get<SuccessResponse<StaffRequest>>("/staff/my-application"),
  getRestaurantOrders: (
    restaurantId: string,
    params: Record<string, unknown> = {},
  ) => orderService.getByRestaurant(restaurantId, params),
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    data: Omit<OrderStatusUpdate, "status"> = {},
  ) => orderService.updateStatus(orderId, status, data),
  getMenu: (restaurantId: string) =>
    api.get<SuccessListResponse<MenuItem>>(`/menu/${restaurantId}`),
  toggleMenuItemAvailability: (
    restaurantId: string,
    itemId: string,
    isAvailable: boolean,
  ) =>
    api.patch<SuccessResponse<MenuItem>>(
      `/staff/menu/${restaurantId}/items/${itemId}/availability`,
      {
        is_available: isAvailable,
      },
    ),
  cancelOrder: (orderId: string, reason: string | null) =>
    orderService.cancelOrder(orderId, reason),
};
