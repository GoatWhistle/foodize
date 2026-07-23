import { fireEvent, render, screen } from "@testing-library/react-native";
import { NotificationItem } from "@/components/domain/NotificationItem";
import type { Notification } from "@shared/types/models";

const makeNotification = (overrides: Partial<Notification> = {}) =>
  ({
    id: "n1",
    user_id: "u1",
    title: "Заказ готов",
    message: "Ваш заказ готов к выдаче",
    title_key: null,
    message_key: null,
    params: {},
    type: "ORDER_STATUS",
    is_read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }) as Notification;

describe("NotificationItem", () => {
  it("renders title and message", () => {
    render(<NotificationItem notification={makeNotification()} />);
    expect(screen.getByText("Заказ готов")).toBeTruthy();
    expect(screen.getByText("Ваш заказ готов к выдаче")).toBeTruthy();
  });

  it("shows the unread dot for unread notifications", () => {
    render(<NotificationItem notification={makeNotification({ is_read: false })} />);
    expect(screen.getByTestId("notification-unread-dot")).toBeTruthy();
  });

  it("hides the unread dot for read notifications", () => {
    render(<NotificationItem notification={makeNotification({ is_read: true })} />);
    expect(screen.queryByTestId("notification-unread-dot")).toBeNull();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    render(<NotificationItem notification={makeNotification()} onPress={onPress} />);
    fireEvent.press(screen.getByTestId("notification-n1"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete when the delete button is pressed", () => {
    const onDelete = jest.fn();
    render(<NotificationItem notification={makeNotification()} onDelete={onDelete} />);
    fireEvent.press(screen.getByTestId("notification-delete-n1"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("renders a system notification without a delete button", () => {
    render(<NotificationItem notification={makeNotification({ type: "SYSTEM" })} />);
    expect(screen.queryByTestId("notification-delete-n1")).toBeNull();
  });

  it("renders an older notification date", () => {
    render(
      <NotificationItem
        notification={makeNotification({ created_at: "2000-05-10T09:00:00Z" })}
      />,
    );
    expect(screen.getByText("Заказ готов")).toBeTruthy();
  });

  it("handles an invalid created_at date", () => {
    render(<NotificationItem notification={makeNotification({ created_at: "not-a-date" })} />);
    expect(screen.getByText("Заказ готов")).toBeTruthy();
  });

  it("resolves localized title and message from keys", () => {
    render(
      <NotificationItem
        notification={makeNotification({
          title_key: "notifications.orderReady.title",
          message_key: "notifications.orderReady.message",
          params: { restaurant: "Кафе" },
        })}
      />,
    );
    expect(screen.getByText("Заказ готов!")).toBeTruthy();
  });
});
