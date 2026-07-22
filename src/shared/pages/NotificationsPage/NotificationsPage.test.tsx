import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { NotificationsPage } from "@shared/pages/NotificationsPage/NotificationsPage";
import type { Notification } from "@shared/types/models";
import { t } from "@shared/i18n/useTranslation";

const makeNotification = (over: Partial<Notification> = {}): Notification => ({
  id: "n1",
  user_id: "u1",
  type: "ORDER_STATUS",
  title: "Заказ готов",
  message: "Ваш заказ можно забрать",
  params: {},
  is_read: false,
  created_at: new Date().toISOString(),
  ...over,
});

const makeStore = (over: Partial<ReturnType<typeof baseStore>> = {}) => () => ({
  ...baseStore(),
  ...over,
});

const baseStore = () => ({
  notifications: [] as Notification[],
  total: 0,
  unreadCount: 0,
  fetchNotifications: vi.fn().mockResolvedValue(undefined),
  loadMore: vi.fn().mockResolvedValue(undefined),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  deleteAll: vi.fn(),
});

describe("NotificationsPage", () => {
  it("fetches notifications on mount and shows the empty state", async () => {
    const fetchNotifications = vi.fn().mockResolvedValue(undefined);
    render(<NotificationsPage useNotificationStore={makeStore({ fetchNotifications })} />);
    await waitFor(() => { expect(screen.getByText(t("profile.notifications.empty"))).toBeInTheDocument(); });
    expect(fetchNotifications).toHaveBeenCalledWith(1);
  });

  it("renders a list of notifications grouped by day", async () => {
    const notifications = [
      makeNotification({ id: "a", title: "Первое", message: "msg 1" }),
      makeNotification({ id: "b", title: "Второе", message: "msg 2", is_read: true }),
    ];
    render(
      <NotificationsPage
        useNotificationStore={makeStore({ notifications, total: 2 })}
      />,
    );
    await waitFor(() => { expect(screen.getByText("Первое")).toBeInTheDocument(); });
    expect(screen.getByText("Второе")).toBeInTheDocument();
    expect(screen.getByText(t("common.time.today"))).toBeInTheDocument();
  });

  it("marks an unread notification as read on click", async () => {
    const user = userEvent.setup();
    const markAsRead = vi.fn();
    const notifications = [makeNotification({ id: "a", title: "Кликни меня" })];
    render(
      <NotificationsPage
        useNotificationStore={makeStore({ notifications, total: 1, markAsRead })}
      />,
    );
    await waitFor(() => { expect(screen.getByText("Кликни меня")).toBeInTheDocument(); });
    await user.click(screen.getByText("Кликни меня"));
    expect(markAsRead).toHaveBeenCalledWith("a");
  });

  it("shows a mark-all button when there are unread items and calls it", async () => {
    const user = userEvent.setup();
    const markAllAsRead = vi.fn();
    const notifications = [makeNotification({ id: "a" })];
    render(
      <NotificationsPage
        useNotificationStore={makeStore({ notifications, total: 1, unreadCount: 1, markAllAsRead })}
      />,
    );
    await waitFor(() => { expect(screen.getByRole("button", { name: t("profile.notifications.markAllRead") })).toBeInTheDocument(); });
    await user.click(screen.getByRole("button", { name: t("profile.notifications.markAllRead") }));
    expect(markAllAsRead).toHaveBeenCalled();
  });

  it("deletes a single notification", async () => {
    const user = userEvent.setup();
    const deleteNotification = vi.fn();
    const notifications = [makeNotification({ id: "a", title: "Удаляемое" })];
    render(
      <NotificationsPage
        useNotificationStore={makeStore({ notifications, total: 1, deleteNotification })}
      />,
    );
    await waitFor(() => { expect(screen.getByText("Удаляемое")).toBeInTheDocument(); });
    await user.click(screen.getByRole("button", { name: t("profile.notifications.delete") }));
    expect(deleteNotification).toHaveBeenCalledWith("a");
  });

  it("deletes all notifications", async () => {
    const user = userEvent.setup();
    const deleteAll = vi.fn();
    const notifications = [makeNotification({ id: "a" })];
    render(
      <NotificationsPage
        useNotificationStore={makeStore({ notifications, total: 1, deleteAll })}
      />,
    );
    await waitFor(() => { expect(screen.getByRole("button", { name: t("profile.notifications.deleteAll") })).toBeInTheDocument(); });
    await user.click(screen.getByRole("button", { name: t("profile.notifications.deleteAll") }));
    expect(deleteAll).toHaveBeenCalled();
  });

  it("loads more when there are additional pages", async () => {
    const user = userEvent.setup();
    const loadMore = vi.fn().mockResolvedValue(undefined);
    const notifications = [makeNotification({ id: "a" })];
    render(
      <NotificationsPage
        useNotificationStore={makeStore({ notifications, total: 5, loadMore })}
      />,
    );
    await waitFor(() => { expect(screen.getByRole("button", { name: t("common.actions.loadMore") })).toBeInTheDocument(); });
    await user.click(screen.getByRole("button", { name: t("common.actions.loadMore") }));
    expect(loadMore).toHaveBeenCalled();
  });
});
