import { create } from "zustand";
import { notificationService } from "@shared/services/notificationService.js";

export function createNotificationStore({ createNotificationWebSocket, onNewNotification = null } = {}) {
  return create((set, get) => {
  let wsInstance = null;
  return ({
    notifications: [],
    unreadCount: 0,
    total: 0,
    page: 1,
    connectionStatus: "closed",
    wasEverConnected: false,

    fetchNotifications: async (page = 1) => {
      try {
        const res = await notificationService.getNotifications({ page, size: 20 });
        const { items, total, unread_count } = res.data;
        set((s) => ({
          notifications: page === 1 ? items : [...s.notifications, ...items],
          total,
          unreadCount: unread_count,
          page,
        }));
      } catch {}
    },

    loadMore: async () => {
      const { page, total, notifications } = get();
      if (notifications.length >= total) return;
      await get().fetchNotifications(page + 1);
    },

    markAsRead: async (id) => {
      let wasUnread = false;
      set((s) => {
        const n = s.notifications.find((n) => n.id === id);
        wasUnread = n ? !n.is_read : false;
        return {
          notifications: s.notifications.map((n) => n.id === id ? { ...n, is_read: true } : n),
          unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
        };
      });
      try {
        await notificationService.markAsRead(id);
      } catch {
        set((s) => ({
          notifications: s.notifications.map((n) => n.id === id ? { ...n, is_read: false } : n),
          unreadCount: wasUnread ? s.unreadCount + 1 : s.unreadCount,
        }));
      }
    },

    markAllAsRead: async () => {
      const markedIds = new Set(
        get().notifications.filter((n) => !n.is_read).map((n) => n.id),
      );
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
      try {
        await notificationService.markAllAsRead();
      } catch {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            markedIds.has(n.id) ? { ...n, is_read: false } : n,
          ),
          unreadCount: markedIds.size,
        }));
      }
    },

    deleteNotification: async (id) => {
      let removed = null;
      set((s) => {
        removed = s.notifications.find((n) => n.id === id) ?? null;
        return {
          notifications: s.notifications.filter((n) => n.id !== id),
          total: Math.max(0, s.total - 1),
          unreadCount: removed && !removed.is_read ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
        };
      });
      try {
        await notificationService.deleteNotification(id);
      } catch {
        if (removed) {
          set((s) => ({
            notifications: [removed, ...s.notifications],
            total: s.total + 1,
            unreadCount: !removed.is_read ? s.unreadCount + 1 : s.unreadCount,
          }));
        }
      }
    },

    deleteAll: async () => {
      let snapshot = null;
      set((s) => {
        snapshot = { notifications: s.notifications, total: s.total, unreadCount: s.unreadCount, page: s.page };
        return { notifications: [], total: 0, unreadCount: 0, page: 1 };
      });
      try {
        await notificationService.deleteAll();
      } catch {
        if (snapshot) set(snapshot);
      }
    },

    connectWs: (userId) => {
      if (wsInstance || !createNotificationWebSocket) return;
      set({ connectionStatus: "connecting" });
      wsInstance = createNotificationWebSocket(
        userId,
        (data) => {
          if (data.type === "connected") {
            get().fetchNotifications(1);
            return;
          }
          set((s) => ({
            notifications: [data, ...s.notifications],
            total: s.total + 1,
            unreadCount: s.unreadCount + 1,
          }));
          onNewNotification?.();
        },
        () => set({ connectionStatus: "closed" }),
        (status) => {
          set((s) => ({ connectionStatus: status, wasEverConnected: s.wasEverConnected || status === "connected" }));
          if (status === "connected") get().fetchNotifications(1);
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
  });
  });
}
