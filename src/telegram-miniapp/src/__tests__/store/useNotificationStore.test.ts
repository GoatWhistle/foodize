import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { useNotificationStore } from "../../store/useNotificationStore";
import { notificationService } from "@shared/services/notificationService";
import { createNotificationWebSocket } from "../../services/api";
import type { Notification } from "@shared/types/models";
import type {
  WebSocketStatus,
  ReliableWebSocket,
} from "@shared/services/api";

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

const logErrorMock = vi.hoisted(() => vi.fn());
vi.mock("@shared/utils/logError", () => ({
  logError: (...a: unknown[]): void => {
    logErrorMock(...a);
  },
}));

const notificationServiceMock = notificationService as unknown as {
  getNotifications: Mock;
  markAsRead: Mock;
  markAllAsRead: Mock;
  deleteNotification: Mock;
  deleteAll: Mock;
};

const createNotificationWebSocketMock =
  createNotificationWebSocket as unknown as Mock;

const notifList = (items: Partial<Notification>[]): Notification[] =>
  items as Notification[];

describe("useNotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.getState().disconnectWs();
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      total: 0,
      page: 1,
      connectionStatus: "closed",
    });
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

  it("should connect to WebSocket successfully", () => {
    let mockOnMessage!: (data: Record<string, unknown>) => void;
    let mockOnClose!: () => void;
    let mockOnStatusChange!: (status: WebSocketStatus) => void;

    const mockWs = {
      close: vi.fn(),
    } as unknown as ReliableWebSocket;

    createNotificationWebSocketMock.mockImplementationOnce(
      (
        _userId: string,
        onMessage: (data: Record<string, unknown>) => void,
        onClose: () => void,
        onStatusChange: (status: WebSocketStatus) => void,
      ) => {
        mockOnMessage = onMessage;
        mockOnClose = onClose;
        mockOnStatusChange = onStatusChange;
        return mockWs;
      },
    );

    useNotificationStore.getState().connectWs("user-1");

    expect(createNotificationWebSocket).toHaveBeenCalledWith(
      "user-1",
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );

    expect(useNotificationStore.getState().connectionStatus).toBe("connecting");

    mockOnStatusChange("connected");
    expect(useNotificationStore.getState().connectionStatus).toBe("connected");

    mockOnMessage({ type: "connected" });
    expect(notificationServiceMock.getNotifications).toHaveBeenCalled();

    mockOnMessage({ id: "n3", type: "order_status", title: "Заказ готов", message: "Ваш заказ готов к выдаче", is_read: false });
    expect(useNotificationStore.getState().total).toBe(1);
    expect(useNotificationStore.getState().unreadCount).toBe(1);

    mockOnClose();
    expect(useNotificationStore.getState().connectionStatus).toBe("closed");
  });

  it("fires Telegram haptic feedback on a new notification", () => {
    const notificationOccurred = vi.fn();
    const prevTelegram = window.Telegram;
    window.Telegram = {
      WebApp: { HapticFeedback: { notificationOccurred } },
    };

    let onMessage!: (data: Record<string, unknown>) => void;
    createNotificationWebSocketMock.mockImplementationOnce(
      (_id: string, msg: (d: Record<string, unknown>) => void) => {
        onMessage = msg;
        return { close: vi.fn() };
      },
    );
    useNotificationStore.getState().connectWs("user-1");

    onMessage({ id: "n9", type: "order_status", title: "T", message: "M", is_read: false });

    expect(notificationOccurred).toHaveBeenCalledWith("success");
    expect(logErrorMock).not.toHaveBeenCalled();

    window.Telegram = prevTelegram as NonNullable<typeof window.Telegram>;
  });

  it("logs an error when haptic feedback throws on a new notification", () => {
    const prevTelegram = window.Telegram;
    window.Telegram = {
      WebApp: {
        HapticFeedback: {
          notificationOccurred: () => {
            throw new Error("haptic unavailable");
          },
        },
      },
    };

    let onMessage!: (data: Record<string, unknown>) => void;
    createNotificationWebSocketMock.mockImplementationOnce(
      (_id: string, msg: (d: Record<string, unknown>) => void) => {
        onMessage = msg;
        return { close: vi.fn() };
      },
    );
    useNotificationStore.getState().connectWs("user-1");

    onMessage({ id: "n10", type: "order_status", title: "T", message: "M", is_read: false });

    expect(logErrorMock).toHaveBeenCalledWith(
      "notificationStore.haptic",
      expect.any(Error),
    );

    window.Telegram = prevTelegram as NonNullable<typeof window.Telegram>;
  });

  it("should disconnect from WebSocket", () => {
    const mockWs = { close: vi.fn() };
    createNotificationWebSocketMock.mockReturnValueOnce(mockWs);
    useNotificationStore.getState().connectWs("user-1");

    useNotificationStore.getState().disconnectWs();

    expect(mockWs.close).toHaveBeenCalled();
    expect(useNotificationStore.getState().connectionStatus).toBe("closed");

    createNotificationWebSocketMock.mockReturnValueOnce({ close: vi.fn() });
    useNotificationStore.getState().connectWs("user-1");
    expect(createNotificationWebSocket).toHaveBeenCalledTimes(2);
  });

  it("should ignore connect if already connected", () => {
    createNotificationWebSocketMock.mockReturnValueOnce({ close: vi.fn() });
    useNotificationStore.getState().connectWs("user-1");
    expect(createNotificationWebSocket).toHaveBeenCalledTimes(1);

    useNotificationStore.getState().connectWs("user-1");
    expect(createNotificationWebSocket).toHaveBeenCalledTimes(1);
  });
});
