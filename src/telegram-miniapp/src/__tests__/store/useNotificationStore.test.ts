import { describe, it, expect, vi, beforeEach } from "vitest";
import { useNotificationStore } from "../../store/useNotificationStore";
import {
  notificationServiceMock,
  notifList,
  resetNotificationStore,
} from "./notificationStoreHelpers";

vi.mock("@shared/services/notificationService", () => ({
  notificationService: {
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    deleteAll: vi.fn(),
  },
}));

vi.mock("../../services/api", () => ({
  createNotificationWebSocket: vi.fn(),
}));

vi.mock("@shared/utils/logError", () => ({
  logError: vi.fn(),
}));

describe("useNotificationStore fetching and mutations", () => {
  beforeEach(() => {
    resetNotificationStore();
    vi.clearAllMocks();
  });

  it("should fetch notifications successfully on page 1", async () => {
    notificationServiceMock.getNotifications.mockResolvedValueOnce({
      data: {
        items: [{ id: "n1", is_read: false }],
        total: 1,
        unread_count: 1,
      },
    });

    await useNotificationStore.getState().fetchNotifications(1);

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([{ id: "n1", is_read: false }]);
    expect(state.total).toBe(1);
    expect(state.unreadCount).toBe(1);
    expect(state.page).toBe(1);
  });

  it("should fetch notifications successfully and append on page > 1", async () => {
    useNotificationStore.setState({
      notifications: notifList([{ id: "n1", is_read: false }]),
      total: 2,
      unreadCount: 2,
      page: 1,
    });

    notificationServiceMock.getNotifications.mockResolvedValueOnce({
      data: {
        items: [{ id: "n2", is_read: true }],
        total: 2,
        unread_count: 1,
      },
    });

    await useNotificationStore.getState().fetchNotifications(2);

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([
      { id: "n1", is_read: false },
      { id: "n2", is_read: true },
    ]);
    expect(state.total).toBe(2);
    expect(state.unreadCount).toBe(1);
    expect(state.page).toBe(2);
  });

  it("should load more notifications if not fully loaded", async () => {
    useNotificationStore.setState({
      notifications: notifList([{ id: "n1", is_read: false }]),
      total: 5,
      unreadCount: 1,
      page: 1,
    });

    notificationServiceMock.getNotifications.mockResolvedValueOnce({
      data: {
        items: [{ id: "n2", is_read: true }],
        total: 5,
        unread_count: 1,
      },
    });

    await useNotificationStore.getState().loadMore();

    const state = useNotificationStore.getState();
    expect(state.page).toBe(2);
    expect(state.notifications.length).toBe(2);
  });

  it("should not load more if fully loaded", async () => {
    useNotificationStore.setState({
      notifications: notifList([{ id: "n1", is_read: false }]),
      total: 1,
      unreadCount: 1,
      page: 1,
    });

    await useNotificationStore.getState().loadMore();

    expect(notificationServiceMock.getNotifications).not.toHaveBeenCalled();
  });

  it("should mark as read successfully", async () => {
    useNotificationStore.setState({
      notifications: notifList([
        { id: "n1", is_read: false },
        { id: "n2", is_read: false },
      ]),
      unreadCount: 2,
    });

    notificationServiceMock.markAsRead.mockResolvedValueOnce({});

    await useNotificationStore.getState().markAsRead("n1");

    const state = useNotificationStore.getState();
    expect(state.notifications[0]?.is_read).toBe(true);
    expect(state.notifications[1]?.is_read).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it("should mark all as read successfully", async () => {
    useNotificationStore.setState({
      notifications: notifList([
        { id: "n1", is_read: false },
        { id: "n2", is_read: false },
      ]),
      unreadCount: 2,
    });

    notificationServiceMock.markAllAsRead.mockResolvedValueOnce({});

    await useNotificationStore.getState().markAllAsRead();

    const state = useNotificationStore.getState();
    expect(state.notifications.every((n) => n.is_read)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("should delete a notification successfully", async () => {
    useNotificationStore.setState({
      notifications: notifList([
        { id: "n1", is_read: false },
        { id: "n2", is_read: true },
      ]),
      total: 2,
      unreadCount: 1,
    });

    notificationServiceMock.deleteNotification.mockResolvedValueOnce({});

    await useNotificationStore.getState().deleteNotification("n1");

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([{ id: "n2", is_read: true }]);
    expect(state.total).toBe(1);
    expect(state.unreadCount).toBe(0);
  });

  it("should delete all successfully", async () => {
    useNotificationStore.setState({
      notifications: notifList([{ id: "n1", is_read: false }]),
      total: 1,
      unreadCount: 1,
    });

    notificationServiceMock.deleteAll.mockResolvedValueOnce({});

    await useNotificationStore.getState().deleteAll();

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.unreadCount).toBe(0);
  });
});
