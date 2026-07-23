import { describe, it, expect, vi, beforeEach } from "vitest";
import { useNotificationStore } from "../../store/useNotificationStore";
import { createNotificationWebSocket } from "../../services/api";
import type {
  WebSocketStatus,
  ReliableWebSocket,
} from "@shared/services/api";
import {
  createNotificationWebSocketMock,
  notificationServiceMock,
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

const logErrorMock = vi.hoisted(() => vi.fn());
vi.mock("@shared/utils/logError", () => ({
  logError: (...a: unknown[]): void => {
    logErrorMock(...a);
  },
}));

describe("useNotificationStore websocket", () => {
  beforeEach(() => {
    resetNotificationStore();
    vi.clearAllMocks();
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
