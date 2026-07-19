import { create, type StoreApi, type UseBoundStore } from "zustand";
import { notificationService } from "@shared/services/notificationService";
import { parseNotificationMessage } from "@shared/utils/wsMessages";
import { logError } from "@shared/utils/logError";
import { optimisticMutation } from "@shared/store/optimistic";
import type { Notification } from "@shared/types/models";
import type { WebSocketStatus, ReliableWebSocket } from "@shared/services/api";

type CreateNotificationWebSocket = (
  userId: string,
  onMessage: (data: Record<string, unknown>) => void,
  onClose?: () => void,
  onStatusChange?: (status: WebSocketStatus) => void,
) => ReliableWebSocket;

export interface CreateNotificationStoreOptions {
  createNotificationWebSocket?: CreateNotificationWebSocket;
  onNewNotification?: (() => void) | null;
}

export interface NotificationStoreState {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  page: number;
  connectionStatus: WebSocketStatus;
  wasEverConnected: boolean;
  fetchNotifications: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  connectWs: (userId: string) => void;
  disconnectWs: () => void;
}

export function createNotificationStore({
  createNotificationWebSocket,
  onNewNotification = null,
}: CreateNotificationStoreOptions = {}): UseBoundStore<
  StoreApi<NotificationStoreState>
> {
  return create<NotificationStoreState>((set, get) => {
    let wsInstance: ReliableWebSocket | null = null;
    return {
      notifications: [],
      unreadCount: 0,
      total: 0,
      page: 1,
      connectionStatus: "closed",
      wasEverConnected: false,

      fetchNotifications: async (page = 1) => {
        try {
          const response = await notificationService.getNotifications({ page, size: 20 });
          const { items, total, unread_count } = response.data;
          set((s) => ({
            notifications: page === 1 ? items : [...s.notifications, ...items],
            total,
            unreadCount: unread_count,
            page,
          }));
        } catch (err) {
          logError("notificationStore.fetchNotifications", err);
        }
      },

      loadMore: async () => {
        const { page, total, notifications } = get();
        if (notifications.length >= total) return;
        await get().fetchNotifications(page + 1);
      },

      markAsRead: async (id) =>
        optimisticMutation({
          get,
          set,
          keys: ["notifications", "unreadCount"],
          context: "notificationStore.markAsRead",
          apply: () =>
            { set((s) => {
              const target = s.notifications.find((n) => n.id === id);
              const wasUnread = target ? !target.is_read : false;
              return {
                notifications: s.notifications.map((n) =>
                  n.id === id ? { ...n, is_read: true } : n,
                ),
                unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
              };
            }); },
          commit: () => notificationService.markAsRead(id),
        }),

      markAllAsRead: async () =>
        optimisticMutation({
          get,
          set,
          keys: ["notifications", "unreadCount"],
          context: "notificationStore.markAllAsRead",
          apply: () =>
            { set((s) => ({
              notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
              unreadCount: 0,
            })); },
          commit: () => notificationService.markAllAsRead(),
        }),

      deleteNotification: async (id) =>
        optimisticMutation({
          get,
          set,
          keys: ["notifications", "total", "unreadCount"],
          context: "notificationStore.deleteNotification",
          apply: () =>
            { set((s) => {
              const removed = s.notifications.find((n) => n.id === id);
              return {
                notifications: s.notifications.filter((n) => n.id !== id),
                total: Math.max(0, s.total - 1),
                unreadCount:
                  removed && !removed.is_read
                    ? Math.max(0, s.unreadCount - 1)
                    : s.unreadCount,
              };
            }); },
          commit: () => notificationService.deleteNotification(id),
        }),

      deleteAll: async () =>
        optimisticMutation({
          get,
          set,
          keys: ["notifications", "total", "unreadCount", "page"],
          context: "notificationStore.deleteAll",
          apply: () => { set({ notifications: [], total: 0, unreadCount: 0, page: 1 }); },
          commit: () => notificationService.deleteAll(),
        }),

      connectWs: (userId) => {
        if (wsInstance || !createNotificationWebSocket) return;
        set({ connectionStatus: "connecting" });
        wsInstance = createNotificationWebSocket(
          userId,
          (data) => {
            if (data['type'] === "connected") {
              void get().fetchNotifications(1);
              return;
            }
            const incoming = parseNotificationMessage(data);
            if (!incoming) return;
            set((s) => ({
              notifications: [incoming, ...s.notifications],
              total: s.total + 1,
              unreadCount: s.unreadCount + 1,
            }));
            onNewNotification?.();
          },
          () => { set({ connectionStatus: "closed" }); },
          (status) => {
            set((s) => ({
              connectionStatus: status,
              wasEverConnected: s.wasEverConnected || status === "connected",
            }));
            if (status === "connected") void get().fetchNotifications(1);
          },
        );
      },

      disconnectWs: () => {
        if (wsInstance) {
          wsInstance.close();
          wsInstance = null;
          set({ connectionStatus: "closed" });
        }
      },
    };
  });
}
