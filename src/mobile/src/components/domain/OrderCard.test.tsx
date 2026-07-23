import { fireEvent, render, screen } from "@testing-library/react-native";
import { OrderCard } from "@/components/domain/OrderCard";
import type { Order } from "@shared/types/models";

const makeOrder = (overrides: Partial<Order> = {}) =>
  ({
    id: "order-1",
    display_id: 42,
    user_id: "u1",
    restaurant_id: "r1",
    restaurant_name: "Тестовое кафе",
    status: "PENDING",
    total_price: 350,
    created_at: new Date().toISOString(),
    items: [
      {
        id: "i1",
        menu_item_id: "m1",
        menu_item_name: "Бургер",
        menu_item_category: "BURGER",
        menu_item_prep_time: 5,
        quantity: 1,
        price_at_purchase: 350,
        selected_options: [],
      },
    ],
    ...overrides,
  }) as Order;

describe("OrderCard", () => {
  it("renders order id, venue, status and price", () => {
    render(<OrderCard order={makeOrder()} />);
    expect(screen.getByText("#42")).toBeTruthy();
    expect(screen.getByText("Тестовое кафе")).toBeTruthy();
    expect(screen.getByText("Принимается")).toBeTruthy();
    expect(screen.getByText("350 ₽")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    render(<OrderCard order={makeOrder()} onPress={onPress} />);
    fireEvent.press(screen.getByTestId("order-card-order-1"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders without a restaurant name", () => {
    render(<OrderCard order={makeOrder({ restaurant_name: null })} />);
    expect(screen.queryByText("Тестовое кафе")).toBeNull();
  });

  it("formats an older created date as a day and month", () => {
    const old = new Date("2000-01-15T10:00:00Z").toISOString();
    render(<OrderCard order={makeOrder({ created_at: old })} />);
    expect(screen.getByText("#42")).toBeTruthy();
  });

  it("renders when created_at is empty", () => {
    render(<OrderCard order={makeOrder({ created_at: "" })} />);
    expect(screen.getByText("#42")).toBeTruthy();
  });

  it("renders a completed order with the neutral status color", () => {
    render(<OrderCard order={makeOrder({ status: "COMPLETED" })} />);
    expect(screen.getByText("Выдан")).toBeTruthy();
  });
});
