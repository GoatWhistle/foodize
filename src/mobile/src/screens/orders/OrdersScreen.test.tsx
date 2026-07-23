import { fireEvent, render, screen } from "@testing-library/react-native";
import { OrdersScreen } from "@/screens/orders/OrdersScreen";
import { triggerRefresh } from "@/screens/testUtils";
import { useOrdersPageLogic } from "@shared/hooks/useOrdersPageLogic";
import type { Order } from "@shared/types/models";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@shared/hooks/useOrdersPageLogic", () => ({
  useOrdersPageLogic: jest.fn(),
}));

const makeOrder = (id: string) =>
  ({
    id,
    display_id: 7,
    user_id: "u1",
    restaurant_id: "r1",
    restaurant_name: "Кафе",
    status: "PENDING",
    total_price: 100,
    created_at: new Date().toISOString(),
    items: [],
  }) as Order;

const mockedHook = jest.mocked(useOrdersPageLogic);

const baseResult = {
  statusFilter: "",
  setStatusFilter: jest.fn(),
  page: 1,
  setPage: jest.fn(),
  visibleOrders: [] as Order[],
  allOrders: [] as Order[],
  ordersLoading: false,
  ordersError: null as string | null,
  ordersTotal: 0,
  totalPages: 0,
  hasMore: false,
  sentinelRef: { current: null },
  refresh: jest.fn(),
};

describe("OrdersScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedHook.mockReturnValue({ ...baseResult });
  });

  it("shows a skeleton while initially loading", () => {
    mockedHook.mockReturnValue({ ...baseResult, ordersLoading: true, visibleOrders: [] });
    render(<OrdersScreen />);
    expect(screen.getByText("Мои заказы")).toBeTruthy();
  });

  it("shows an error state and retries", () => {
    const refresh = jest.fn();
    mockedHook.mockReturnValue({ ...baseResult, ordersError: "Ошибка загрузки", refresh });
    render(<OrdersScreen />);
    expect(screen.getByText("Ошибка загрузки")).toBeTruthy();
    fireEvent.press(screen.getByText("Попробовать снова"));
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the empty state for no orders", () => {
    render(<OrdersScreen />);
    expect(screen.getByText("Заказов пока нет")).toBeTruthy();
  });

  it("shows the active empty state", () => {
    mockedHook.mockReturnValue({ ...baseResult, statusFilter: "ACTIVE" });
    render(<OrdersScreen />);
    expect(screen.getByText("Активных заказов нет")).toBeTruthy();
  });

  it("shows the done empty state", () => {
    mockedHook.mockReturnValue({ ...baseResult, statusFilter: "DONE" });
    render(<OrdersScreen />);
    expect(screen.getByText("Завершённых заказов нет")).toBeTruthy();
  });

  it("renders orders and navigates on tap", () => {
    mockedHook.mockReturnValue({ ...baseResult, visibleOrders: [makeOrder("o1")] });
    render(<OrdersScreen />);
    fireEvent.press(screen.getByTestId("order-card-o1"));
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/order/[id]", params: { id: "o1" } });
  });

  it("changes the status filter", () => {
    const setStatusFilter = jest.fn();
    mockedHook.mockReturnValue({
      ...baseResult,
      visibleOrders: [makeOrder("o1")],
      setStatusFilter,
    });
    render(<OrdersScreen />);
    fireEvent.press(screen.getByTestId("orders-filter-ACTIVE"));
    expect(setStatusFilter).toHaveBeenCalledWith("ACTIVE");
  });

  it("paginates on end reached when more pages exist", () => {
    const setPage = jest.fn();
    mockedHook.mockReturnValue({
      ...baseResult,
      visibleOrders: [makeOrder("o1")],
      hasMore: true,
      setPage,
    });
    render(<OrdersScreen />);
    fireEvent(screen.getByTestId("orders-list"), "endReached");
    expect(setPage).toHaveBeenCalled();
    const calls = setPage.mock.calls as unknown as [(page: number) => number][];
    const updater = calls[0]?.[0];
    expect(updater?.(1)).toBe(2);
  });

  it("does not paginate when there are no more pages", () => {
    const setPage = jest.fn();
    mockedHook.mockReturnValue({
      ...baseResult,
      visibleOrders: [makeOrder("o1")],
      hasMore: false,
      setPage,
    });
    render(<OrdersScreen />);
    fireEvent(screen.getByTestId("orders-list"), "endReached");
    expect(setPage).not.toHaveBeenCalled();
  });

  it("refreshes on pull to refresh", () => {
    const refresh = jest.fn();
    mockedHook.mockReturnValue({
      ...baseResult,
      visibleOrders: [makeOrder("o1")],
      refresh,
    });
    render(<OrdersScreen />);
    triggerRefresh("orders-list");
    expect(refresh).toHaveBeenCalled();
  });
});
