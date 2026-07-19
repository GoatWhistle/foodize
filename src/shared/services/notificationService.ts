import { api } from "@shared/services/api.instance";
import type {
  Notification,
  NotificationList,
  SuccessResponse,
} from "@shared/types/models";

export const notificationService = {
  getNotifications: (params?: Record<string, unknown>) =>
    api.get<NotificationList>("/notifications", { params }),
  markAsRead: (id: string) =>
    api.post<SuccessResponse<Notification>>(`/notifications/${id}/read`),
  markAllAsRead: () =>
    api.post<SuccessResponse<void>>("/notifications/read-all"),
  deleteNotification: (id: string) =>
    api.delete<SuccessResponse<void>>(`/notifications/${id}`),
  deleteAll: () => api.delete<SuccessResponse<void>>("/notifications"),
};
