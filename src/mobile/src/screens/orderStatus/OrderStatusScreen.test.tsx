import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { OrderStatusScreen } from "@/screens/orderStatus/OrderStatusScreen";
import { useOrderWebSocket } from "@shared/hooks/useOrderWebSocket";
import { useEtaText } from "@shared/hooks/useEtaText";
import { useOrdersStore } from "@/store/useOrdersStore";
import type { Order, OrderStatus } from "@shared/types/models";

jest.mock("@shared/hooks/useOrderWebSocket", () => ({
  useOrderWebSocket: jest.fn(),
}));
jest.mock("@shared/hooks/useEtaText", () => ({
  useEtaText: jest.fn(),
}));
jest.mock("@/store/useOrdersStore", () => ({
  useOrdersStore: jest.fn(),
}));
jest.mock("@/services/api", () => ({
  createOrderWebSocket: jest.fn(),
}));

const makeOrder = (status: OrderStatus, overrides: Partial<Order> = {}) =>
  ({
    id: "order-1",
    display_id: 99,
    user_id: "u1",
    restaurant_id: "r1",
    restaurant_name: "Кафе",
    status,
    total_price: 500,
    cancellation_reason: null,
    comment: null,
    created_at: new Date("2024-01-01T12:00:00Z").toISOString(),
    estimated_ready_at: null,
    items: [
      {
        id: "i1",
        menu_item_id: "m1",
        menu_item_name: "Пицца",
        menu_item_category: "PIZZA",
        menu_item_prep_time: 10,
        quantity: 2,
        price_at_purchase: 250,
        selected_options: [],
      },
    ],
    ...overrides,
  }) as Order;

const mockedStore = jest.mocked(useOrdersStore) as unknown as jest.Mock;
const mockedWs = jest.mocked(useOrderWebSocket);
const mockedEta = jest.mocked(useEtaText);

const setCurrentOrder = (order: Order | null): void => {
  mockedStore.mockImplementation((selector: (s: { currentOrder: Order | null }) => unknown) =>
    selector({ currentOrder: order }),
  );
};

describe("OrderStatusScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedWs.mockReturnValue({ loadOrder: jest.fn().mockResolvedValue(makeOrder("PENDING")) });
    mockedEta.mockReturnValue("");
    setCurrentOrder(null);
  });

  it("shows a loading skeleton when there is no order", () => {
    render(<OrderStatusScreen orderId="order-1" />);
    expect(useOrderWebSocket).toHaveBeenCalled();
  });

  it("renders the order details when loaded", () => {
    setCurrentOrder(makeOrder("PENDING"));
    render(<OrderStatusScreen orderId="order-1" />);
    expect(screen.getByText("Заказ #99")).toBeTruthy();
    expect(screen.getByText("Пицца")).toBeTruthy();
    expect(screen.getByText("Состав заказа")).toBeTruthy();
  });

  it("shows the ETA text when provided", () => {
    setCurrentOrder(makeOrder("ACCEPTED"));
    mockedEta.mockReturnValue("Будет готов через ~10 мин");
    render(<OrderStatusScreen orderId="order-1" />);
    expect(screen.getByTestId("order-eta")).toBeTruthy();
  });

  it("renders the step tracker for non-cancelled orders", () => {
    setCurrentOrder(makeOrder("READY"));
    render(<OrderStatusScreen orderId="order-1" />);
    expect(screen.getByTestId("status-steps")).toBeTruthy();
  });

  it("hides the step tracker for cancelled orders", () => {
    setCurrentOrder(makeOrder("CANCELLED"));
    render(<OrderStatusScreen orderId="order-1" />);
    expect(screen.queryByTestId("status-steps")).toBeNull();
  });

  it("renders a comment when present", () => {
    setCurrentOrder(makeOrder("PENDING", { comment: "Без лука" }));
    render(<OrderStatusScreen orderId="order-1" />);
    expect(screen.getByText("Без лука")).toBeTruthy();
  });

  it("triggers success haptics on a status change", () => {
    setCurrentOrder(makeOrder("PENDING"));
    render(<OrderStatusScreen orderId="order-1" />);
    const options = mockedWs.mock.calls[0]?.[2];
    options?.onStatusChange?.("ACCEPTED", "PENDING");
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );
  });

  it("does not repeat haptics for the same status", () => {
    setCurrentOrder(makeOrder("PENDING"));
    render(<OrderStatusScreen orderId="order-1" />);
    const options = mockedWs.mock.calls[0]?.[2];
    options?.onStatusChange?.("ACCEPTED", "PENDING");
    options?.onStatusChange?.("ACCEPTED", "PENDING");
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
  });

  it("shows an error state for a cancelled order with no items and retries", () => {
    const loadOrder = jest.fn().mockResolvedValue(makeOrder("CANCELLED"));
    mockedWs.mockReturnValue({ loadOrder });
    setCurrentOrder(makeOrder("CANCELLED", { items: [] }));
    render(<OrderStatusScreen orderId="order-1" />);
    fireEvent.press(screen.getByText("Попробовать снова"));
    expect(loadOrder).toHaveBeenCalled();
  });

  it("ignores an order that does not match the id", () => {
    setCurrentOrder(makeOrder("PENDING", { id: "other" }));
    render(<OrderStatusScreen orderId="order-1" />);
    expect(screen.queryByText("Заказ #99")).toBeNull();
  });
});
