import { type Mock } from "vitest";
import { useNotificationStore } from "../../store/useNotificationStore";
import { notificationService } from "@shared/services/notificationService";
import { createNotificationWebSocket } from "../../services/api";
import type { Notification } from "@shared/types/models";

export interface NotificationServiceMock {
  getNotifications: Mock;
  markAsRead: Mock;
  markAllAsRead: Mock;
  deleteNotification: Mock;
  deleteAll: Mock;
}

export const notificationServiceMock =
  notificationService as unknown as NotificationServiceMock;

export const createNotificationWebSocketMock =
  createNotificationWebSocket as unknown as Mock;

export const notifList = (items: Partial<Notification>[]): Notification[] =>
  items as Notification[];

export const resetNotificationStore = (): void => {
  useNotificationStore.getState().disconnectWs();
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    total: 0,
    page: 1,
    connectionStatus: "closed",
  });
};
