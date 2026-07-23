import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { NotificationsScreen } from "@/screens/notifications/NotificationsScreen";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useAuthStore } from "@/store/useAuthStore";
import { setBadgeCount } from "@/platform/pushNotifications";
import { triggerRefresh } from "@/screens/testUtils";
import type { NotificationStoreState } from "@shared/store/createNotificationStore";
import type { Notification } from "@shared/types/models";

jest.mock("@/store/useNotificationStore", () => ({
  useNotificationStore: jest.fn(),
}));
jest.mock("@/store/useAuthStore", () => ({
  useAuthStore: jest.fn(),
}));
jest.mock("@/platform/pushNotifications", () => ({
  setBadgeCount: jest.fn(),
}));

const makeNotification = (id: string, isRead = false) =>
  ({
    id,
    user_id: "u1",
    title: `Уведомление ${id}`,
    message: "Текст",
    title_key: null,
    message_key: null,
    params: {},
    type: "ORDER_STATUS",
    is_read: isRead,
    created_at: new Date().toISOString(),
  }) as Notification;

const storeState = {
  notifications: [] as Notification[],
  unreadCount: 0,
  total: 0,
  page: 1,
  connectionStatus: "closed" as const,
  wasEverConnected: false,
  fetchNotifications: jest.fn().mockResolvedValue(undefined),
  loadMore: jest.fn().mockResolvedValue(undefined),
  markAsRead: jest.fn().mockResolvedValue(undefined),
  markAllAsRead: jest.fn().mockResolvedValue(undefined),
  deleteNotification: jest.fn().mockResolvedValue(undefined),
  deleteAll: jest.fn().mockResolvedValue(undefined),
  connectWs: jest.fn(),
  disconnectWs: jest.fn(),
};

const mockedStore = useNotificationStore as unknown as jest.Mock;
const mockedAuth = useAuthStore as unknown as jest.Mock;

const setStore = (overrides: Partial<typeof storeState>): void => {
  const state = { ...storeState, ...overrides } as unknown as NotificationStoreState;
  mockedStore.mockImplementation((selector: (s: NotificationStoreState) => unknown) =>
    selector(state),
  );
};

describe("NotificationsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(storeState, {
      notifications: [],
      unreadCount: 0,
      total: 0,
      fetchNotifications: jest.fn().mockResolvedValue(undefined),
      loadMore: jest.fn().mockResolvedValue(undefined),
      markAsRead: jest.fn().mockResolvedValue(undefined),
      markAllAsRead: jest.fn().mockResolvedValue(undefined),
      deleteNotification: jest.fn().mockResolvedValue(undefined),
      connectWs: jest.fn(),
      disconnectWs: jest.fn(),
    });
    setStore({});
    mockedAuth.mockImplementation((selector: (s: { user: { id: string } | null }) => unknown) =>
      selector({ user: { id: "u1" } }),
    );
  });

  it("connects the websocket and fetches on mount", async () => {
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(storeState.fetchNotifications).toHaveBeenCalledWith(1);
    });
    expect(storeState.connectWs).toHaveBeenCalledWith("u1");
  });

  it("shows the empty state when there are no notifications", async () => {
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(screen.getByText("Нет уведомлений")).toBeTruthy();
    });
  });

  it("renders notifications and the unread badge", async () => {
    setStore({ notifications: [makeNotification("n1")], total: 1, unreadCount: 1 });
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(screen.getByText("Уведомление n1")).toBeTruthy();
    });
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("marks an unread notification as read on tap", async () => {
    const markAsRead = jest.fn().mockResolvedValue(undefined);
    setStore({ notifications: [makeNotification("n1")], total: 1, unreadCount: 1, markAsRead });
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(screen.getByTestId("notification-n1")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("notification-n1"));
    expect(markAsRead).toHaveBeenCalledWith("n1");
  });

  it("does not mark an already read notification", async () => {
    const markAsRead = jest.fn();
    setStore({
      notifications: [makeNotification("n1", true)],
      total: 1,
      unreadCount: 0,
      markAsRead,
    });
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(screen.getByTestId("notification-n1")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("notification-n1"));
    expect(markAsRead).not.toHaveBeenCalled();
  });

  it("marks all as read", async () => {
    const markAllAsRead = jest.fn().mockResolvedValue(undefined);
    setStore({
      notifications: [makeNotification("n1")],
      total: 1,
      unreadCount: 1,
      markAllAsRead,
    });
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(screen.getByTestId("notifications-mark-all")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("notifications-mark-all"));
    expect(markAllAsRead).toHaveBeenCalled();
  });

  it("deletes a notification", async () => {
    const deleteNotification = jest.fn().mockResolvedValue(undefined);
    setStore({
      notifications: [makeNotification("n1")],
      total: 1,
      unreadCount: 1,
      deleteNotification,
    });
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(screen.getByTestId("notification-delete-n1")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("notification-delete-n1"));
    expect(deleteNotification).toHaveBeenCalledWith("n1");
  });

  it("syncs the badge count with the unread count", async () => {
    setStore({ notifications: [makeNotification("n1")], total: 1, unreadCount: 2 });
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(setBadgeCount).toHaveBeenCalledWith(2);
    });
  });

  it("loads more when scrolled to the end with remaining items", async () => {
    const loadMore = jest.fn().mockResolvedValue(undefined);
    setStore({
      notifications: [makeNotification("n1")],
      total: 5,
      unreadCount: 0,
      loadMore,
    });
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(screen.getByTestId("notifications-list")).toBeTruthy();
    });
    fireEvent(screen.getByTestId("notifications-list"), "endReached");
    expect(loadMore).toHaveBeenCalled();
  });

  it("does not load more when all items are shown", async () => {
    const loadMore = jest.fn();
    setStore({
      notifications: [makeNotification("n1")],
      total: 1,
      unreadCount: 0,
      loadMore,
    });
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(screen.getByTestId("notifications-list")).toBeTruthy();
    });
    fireEvent(screen.getByTestId("notifications-list"), "endReached");
    expect(loadMore).not.toHaveBeenCalled();
  });

  it("refreshes on pull to refresh", async () => {
    const fetchNotifications = jest.fn().mockResolvedValue(undefined);
    setStore({
      notifications: [makeNotification("n1")],
      total: 1,
      unreadCount: 0,
      fetchNotifications,
    });
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(screen.getByTestId("notifications-list")).toBeTruthy();
    });
    fetchNotifications.mockClear();
    triggerRefresh("notifications-list");
    expect(fetchNotifications).toHaveBeenCalledWith(1);
  });

  it("does not connect the websocket without a user", async () => {
    mockedAuth.mockImplementation((selector: (s: { user: { id: string } | null }) => unknown) =>
      selector({ user: null }),
    );
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(storeState.fetchNotifications).toHaveBeenCalled();
    });
    expect(storeState.connectWs).not.toHaveBeenCalled();
  });
});
