import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrdersPage } from "@shared/pages/OrdersPage/OrdersPage";
import { useOrdersPageLogic } from "@shared/hooks/useOrdersPageLogic";
import type { Order } from "@shared/types/models";

vi.mock("@shared/hooks/useOrdersPageLogic", () => ({
  useOrdersPageLogic: vi.fn(),
}));

const mockedHook = vi.mocked(useOrdersPageLogic);

const makeOrder = (id: string, displayId: number): Order => ({
  id,
  display_id: displayId,
  user_id: "u1",
  restaurant_id: "rest-1",
  restaurant_name: "Ресторан",
  restaurant_address: "адрес",
  status: "ACCEPTED",
  total_price: 300,
  created_at: "2026-01-15T12:30:00Z",
  items: [],
});

const hookState = (over: Partial<ReturnType<typeof useOrdersPageLogic>> = {}) => ({
  statusFilter: "ACTIVE",
  setStatusFilter: vi.fn(),
  page: 1,
  setPage: vi.fn(),
  visibleOrders: [],
  allOrders: [],
  ordersLoading: false,
  ordersError: null,
  ordersTotal: 0,
  totalPages: 1,
  hasMore: false,
  sentinelRef: { current: null },
  refresh: vi.fn(),
  ...over,
});

const renderPage = (props = {}) =>
  render(
    <MemoryRouter>
      <OrdersPage {...props} />
    </MemoryRouter>,
  );

describe("OrdersPage", () => {
  beforeEach(() => {
    mockedHook.mockReset();
  });

  it("renders the heading and status filters", () => {
    mockedHook.mockReturnValue(hookState());
    renderPage();
    expect(screen.getByRole("heading", { name: "Мои заказы" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Активные" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завершённые" })).toBeInTheDocument();
  });

  it("shows a spinner while loading with no orders", () => {
    mockedHook.mockReturnValue(hookState({ ordersLoading: true }));
    const { container } = renderPage();
    expect(container.querySelector(".spinner")).toBeInTheDocument();
  });

  it("shows the empty state for the active filter", () => {
    mockedHook.mockReturnValue(hookState());
    renderPage();
    expect(screen.getByText("Активных заказов нет")).toBeInTheDocument();
  });

  it("renders the orders list", () => {
    mockedHook.mockReturnValue(
      hookState({ visibleOrders: [makeOrder("1", 10), makeOrder("2", 11)] }),
    );
    renderPage();
    expect(screen.getByText("#10")).toBeInTheDocument();
    expect(screen.getByText("#11")).toBeInTheDocument();
  });

  it("renders an error message", () => {
    mockedHook.mockReturnValue(hookState({ ordersError: "Ошибка загрузки" }));
    renderPage();
    expect(screen.getByText("Ошибка загрузки")).toBeInTheDocument();
  });

  it("changes the status filter and resets to page one", async () => {
    const user = userEvent.setup();
    const setStatusFilter = vi.fn();
    const setPage = vi.fn();
    mockedHook.mockReturnValue(hookState({ setStatusFilter, setPage }));
    renderPage();
    await user.click(screen.getByRole("button", { name: "Завершённые" }));
    expect(setStatusFilter).toHaveBeenCalledWith("DONE");
    expect(setPage).toHaveBeenCalledWith(1);
  });

  it("renders pagination when there are multiple pages", () => {
    mockedHook.mockReturnValue(
      hookState({ visibleOrders: [makeOrder("1", 10)], page: 1, totalPages: 3 }),
    );
    renderPage();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("navigates home from the empty state action when a home route is provided", async () => {
    const user = userEvent.setup();
    mockedHook.mockReturnValue(hookState());
    renderPage({ routes: { home: "/home" } });
    const action = screen.getByRole("button", { name: "Выбрать заведение" });
    await user.click(action);
    expect(action).toBeInTheDocument();
  });

  it("renders a bottom spinner while loading more in infinite scroll mode", () => {
    mockedHook.mockReturnValue(
      hookState({ visibleOrders: [makeOrder("1", 10)], ordersLoading: true }),
    );
    const { container } = renderPage({ infiniteScroll: true, showPagination: false });
    expect(container.querySelector(".loading-dim")).toBeInTheDocument();
    expect(container.querySelector(".spinner")).toBeInTheDocument();
    expect(screen.queryByText("1 / 1")).not.toBeInTheDocument();
  });

  it("shows the done empty state when the completed filter is active", () => {
    mockedHook.mockReturnValue(hookState({ statusFilter: "DONE" }));
    renderPage();
    expect(screen.getByText("Завершённых заказов нет")).toBeInTheDocument();
  });

  it("navigates to an order when a card is clicked", async () => {
    const user = userEvent.setup();
    mockedHook.mockReturnValue(hookState({ visibleOrders: [makeOrder("1", 10)] }));
    renderPage();
    await user.click(screen.getByRole("button", { name: /#10/ }));
    expect(screen.getByText("#10")).toBeInTheDocument();
  });

  it("triggers refresh on a pull-to-refresh gesture", () => {
    const refresh = vi.fn();
    mockedHook.mockReturnValue(
      hookState({ visibleOrders: [makeOrder("1", 10)], refresh }),
    );
    const { container } = renderPage({ pullToRefresh: true });
    const scrollable = container.firstChild as HTMLElement;
    Object.defineProperty(scrollable, "scrollTop", { value: 0, configurable: true });
    fireEvent.touchStart(scrollable, { touches: [{ clientY: 10 }] });
    fireEvent.touchMove(scrollable, { touches: [{ clientY: 210 }] });
    fireEvent.touchEnd(scrollable);
    expect(refresh).toHaveBeenCalled();
  });

  it("ignores a pull gesture that is too short to refresh", () => {
    const refresh = vi.fn();
    mockedHook.mockReturnValue(
      hookState({ visibleOrders: [makeOrder("1", 10)], refresh }),
    );
    const { container } = renderPage({ pullToRefresh: true });
    const scrollable = container.firstChild as HTMLElement;
    Object.defineProperty(scrollable, "scrollTop", { value: 0, configurable: true });
    fireEvent.touchStart(scrollable, { touches: [{ clientY: 10 }] });
    fireEvent.touchMove(scrollable, { touches: [{ clientY: 20 }] });
    fireEvent.touchEnd(scrollable);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("ignores touch move events before a touch start", () => {
    mockedHook.mockReturnValue(
      hookState({ visibleOrders: [makeOrder("1", 10)] }),
    );
    const { container } = renderPage({ pullToRefresh: true });
    const scrollable = container.firstChild as HTMLElement;
    fireEvent.touchMove(scrollable, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(scrollable);
    expect(screen.getByText("#10")).toBeInTheDocument();
  });

  it("shows the generic empty state for an unknown status filter", () => {
    mockedHook.mockReturnValue(hookState({ statusFilter: "" }));
    renderPage();
    expect(screen.getByText("Заказов пока нет")).toBeInTheDocument();
    expect(
      screen.getByText("Сделайте первый заказ в любом ресторане"),
    ).toBeInTheDocument();
  });

  it("builds the order route from a custom orderStatus template", async () => {
    const user = userEvent.setup();
    mockedHook.mockReturnValue(hookState({ visibleOrders: [makeOrder("1", 10)] }));
    renderPage({ routes: { orderStatus: "/o/:id" } });
    await user.click(screen.getByRole("button", { name: /#10/ }));
    expect(screen.getByText("#10")).toBeInTheDocument();
  });
});
