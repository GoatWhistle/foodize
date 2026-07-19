import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Notification } from "@shared/types/models";

const mocks = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  deleteAll: vi.fn(),
}));

vi.mock("@shared/services/notificationService", () => ({
  notificationService: {
    getNotifications: mocks.getNotifications,
    markAsRead: mocks.markAsRead,
    markAllAsRead: mocks.markAllAsRead,
    deleteNotification: mocks.deleteNotification,
    deleteAll: mocks.deleteAll,
  },
}));

vi.mock("@shared/utils/logError", () => ({ logError: vi.fn() }));

import { createNotificationStore } from "./createNotificationStore";

const notif = (id: string, is_read = false): Notification =>
  ({ id, is_read, type: "SYSTEM", title: "t", message: "m" } as unknown as Notification);

const page = (items: Notification[], total: number, unread: number) => ({
  data: { items, total, unread_count: unread },
});

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.markAsRead.mockResolvedValue(undefined);
  mocks.markAllAsRead.mockResolvedValue(undefined);
  mocks.deleteNotification.mockResolvedValue(undefined);
  mocks.deleteAll.mockResolvedValue(undefined);
});

describe("createNotificationStore", () => {
  it("fetchNotifications replaces list on page 1", async () => {
    mocks.getNotifications.mockResolvedValue(page([notif("1"), notif("2")], 2, 2));
    const store = createNotificationStore();
    await store.getState().fetchNotifications(1);
    const s = store.getState();
    expect(s.notifications).toHaveLength(2);
    expect(s.unreadCount).toBe(2);
    expect(s.total).toBe(2);
  });

  it("fetchNotifications appends on later pages", async () => {
    mocks.getNotifications
      .mockResolvedValueOnce(page([notif("1")], 2, 1))
      .mockResolvedValueOnce(page([notif("2")], 2, 1));
    const store = createNotificationStore();
    await store.getState().fetchNotifications(1);
    await store.getState().fetchNotifications(2);
    expect(store.getState().notifications.map((n) => n.id)).toEqual(["1", "2"]);
  });

  it("fetchNotifications swallows errors", async () => {
    mocks.getNotifications.mockRejectedValue(new Error("net"));
    const store = createNotificationStore();
    await expect(store.getState().fetchNotifications(1)).resolves.toBeUndefined();
  });

  it("loadMore does nothing when everything is loaded", async () => {
    mocks.getNotifications.mockResolvedValue(page([notif("1")], 1, 0));
    const store = createNotificationStore();
    await store.getState().fetchNotifications(1);
    await store.getState().loadMore();
    expect(mocks.getNotifications).toHaveBeenCalledTimes(1);
  });

  it("loadMore fetches the next page when more remain", async () => {
    mocks.getNotifications
      .mockResolvedValueOnce(page([notif("1")], 2, 0))
      .mockResolvedValueOnce(page([notif("2")], 2, 0));
    const store = createNotificationStore();
    await store.getState().fetchNotifications(1);
    await store.getState().loadMore();
    expect(mocks.getNotifications).toHaveBeenCalledTimes(2);
  });

  it("markAsRead flips a notification and decrements unread", async () => {
    mocks.getNotifications.mockResolvedValue(page([notif("1")], 1, 1));
    const store = createNotificationStore();
    await store.getState().fetchNotifications(1);
    await store.getState().markAsRead("1");
    expect(store.getState().notifications[0]?.is_read).toBe(true);
    expect(store.getState().unreadCount).toBe(0);
    expect(mocks.markAsRead).toHaveBeenCalledWith("1");
  });

  it("markAsRead rolls back when commit fails", async () => {
    mocks.getNotifications.mockResolvedValue(page([notif("1")], 1, 1));
    mocks.markAsRead.mockRejectedValue(new Error("net"));
    const store = createNotificationStore();
    await store.getState().fetchNotifications(1);
    await store.getState().markAsRead("1");
    expect(store.getState().notifications[0]?.is_read).toBe(false);
    expect(store.getState().unreadCount).toBe(1);
  });

  it("markAllAsRead zeroes unread", async () => {
    mocks.getNotifications.mockResolvedValue(page([notif("1"), notif("2")], 2, 2));
    const store = createNotificationStore();
    await store.getState().fetchNotifications(1);
    await store.getState().markAllAsRead();
    expect(store.getState().unreadCount).toBe(0);
    expect(store.getState().notifications.every((n) => n.is_read)).toBe(true);
  });

  it("deleteNotification removes and updates counts", async () => {
    mocks.getNotifications.mockResolvedValue(page([notif("1"), notif("2", true)], 2, 1));
    const store = createNotificationStore();
    await store.getState().fetchNotifications(1);
    await store.getState().deleteNotification("1");
    expect(store.getState().notifications).toHaveLength(1);
    expect(store.getState().total).toBe(1);
    expect(store.getState().unreadCount).toBe(0);
  });

  it("deleteAll clears everything", async () => {
    mocks.getNotifications.mockResolvedValue(page([notif("1")], 1, 1));
    const store = createNotificationStore();
    await store.getState().fetchNotifications(1);
    await store.getState().deleteAll();
    expect(store.getState().notifications).toEqual([]);
    expect(store.getState().total).toBe(0);
  });

  it("connectWs wires the socket and handles connected + incoming messages", () => {
    mocks.getNotifications.mockResolvedValue(page([], 0, 0));
    let onMessage!: (d: Record<string, unknown>) => void;
    let onStatus!: (s: string) => void;
    const close = vi.fn();
    const factory = vi.fn(
      (
        _id: string,
        msg: (d: Record<string, unknown>) => void,
        _close: (() => void) | undefined,
        status: (s: string) => void,
      ) => {
        onMessage = msg;
        onStatus = status;
        return { close };
      },
    );
    const onNewNotification = vi.fn();
    const store = createNotificationStore({
      createNotificationWebSocket: factory as never,
      onNewNotification,
    });

    store.getState().connectWs("u1");
    expect(store.getState().connectionStatus).toBe("connecting");

    onStatus("connected");
    expect(store.getState().wasEverConnected).toBe(true);

    onMessage({ type: "connected" });
    onMessage({ id: "n9", type: "SYSTEM", title: "t", message: "m" });
    expect(store.getState().notifications[0]?.id).toBe("n9");
    expect(store.getState().unreadCount).toBe(1);
    expect(onNewNotification).toHaveBeenCalled();

    store.getState().disconnectWs();
    expect(close).toHaveBeenCalled();
    expect(store.getState().connectionStatus).toBe("closed");
  });

  it("connectWs is a no-op without a factory", () => {
    const store = createNotificationStore();
    store.getState().connectWs("u1");
    expect(store.getState().connectionStatus).toBe("closed");
  });
});
