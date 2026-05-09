import { create } from "zustand";
import { notificationService } from "../services/notificationService";
import { createNotificationWebSocket } from "../services/api";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  page: 1,
  _ws: null,

  fetchNotifications: async (page = 1) => {
    try {
      const res = await notificationService.getNotifications({
        page,
        size: 20,
      });
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
    try {
      await notificationService.markAsRead(id);
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n,
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch {}
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch {}
  },

  deleteNotification: async (id) => {
    try {
      await notificationService.deleteNotification(id);
      set((s) => {
        const removed = s.notifications.find((n) => n.id === id);
        return {
          notifications: s.notifications.filter((n) => n.id !== id),
          total: Math.max(0, s.total - 1),
          unreadCount:
            removed && !removed.is_read
              ? Math.max(0, s.unreadCount - 1)
              : s.unreadCount,
        };
      });
    } catch {}
  },

  deleteAll: async () => {
    try {
      await notificationService.deleteAll();
      set({ notifications: [], total: 0, unreadCount: 0, page: 1 });
    } catch {}
  },

  connectWs: (userId) => {
    const existing = get()._ws;
    if (existing) return;

    const ws = createNotificationWebSocket(userId, (data) => {
      set((s) => ({
        notifications: [data, ...s.notifications],
        total: s.total + 1,
        unreadCount: s.unreadCount + 1,
      }));
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(
          "success",
        );
      } catch {}
    });

    set({ _ws: ws });
  },

  disconnectWs: () => {
    const ws = get()._ws;
    if (ws) {
      ws.close();
      set({ _ws: null });
    }
  },
}));
