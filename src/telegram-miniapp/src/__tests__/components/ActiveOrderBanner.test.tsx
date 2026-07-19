import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import type { Order } from "@shared/types/models";
import { ActiveOrderBanner } from "../../components/ActiveOrderBanner/ActiveOrderBanner";
const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../services/api", () => ({
  createOrderWebSocket: vi.fn(() => ({ close: vi.fn() })),
}));

interface OrdersStoreState {
  activeOrder: Order | null;
  setActiveOrder: Mock;
  clearActiveOrder: Mock;
}

let storeState: OrdersStoreState;

vi.mock("../../store/useOrdersStore", () => {
  const useOrdersStore = vi.fn((sel?: (s: OrdersStoreState) => unknown) =>
    sel ? sel(storeState) : storeState,
  ) as unknown as Mock & { getState: () => OrdersStoreState };
  useOrdersStore.getState = () => storeState;
  return { useOrdersStore };
});

const makeStore = (order: Partial<Order> | null): OrdersStoreState => ({
  activeOrder: order as Order | null,
  setActiveOrder: vi.fn(),
  clearActiveOrder: vi.fn(),
});

const renderAt = (path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ActiveOrderBanner />
    </MemoryRouter>,
  );

beforeEach(() => {
  storeState = makeStore(null);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ActiveOrderBanner", () => {
  it("renders nothing when there is no active order", () => {
    renderAt();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a banner for an active order with an accessible label", () => {
    storeState = makeStore({ id: "o1", display_id: 42, status: "ACCEPTED" });
    renderAt();
    const banner = screen.getByRole("button", { name: "Открыть заказ #42" });
    expect(banner).toBeInTheDocument();
    expect(screen.getByText("Заказ #42")).toBeInTheDocument();
  });

  it("renders nothing for a terminal (COMPLETED) status", () => {
    storeState = makeStore({ id: "o1", display_id: 7, status: "COMPLETED" });
    renderAt();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing for a CANCELLED status", () => {
    storeState = makeStore({ id: "o1", display_id: 7, status: "CANCELLED" });
    renderAt();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("hides itself when already on the order detail page", () => {
    storeState = makeStore({ id: "o1", display_id: 99, status: "READY" });
    renderAt("/orders/99");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("navigates to the order page on click", async () => {
    storeState = makeStore({ id: "o1", display_id: 42, status: "ACCEPTED" });
    renderAt();
    await userEvent.click(screen.getByRole("button", { name: "Открыть заказ #42" }));
    expect(navigateMock).toHaveBeenCalledWith("/orders/42");
  });

  it("navigates when activated via keyboard (Enter)", async () => {
    storeState = makeStore({ id: "o1", display_id: 42, status: "PENDING" });
    renderAt();
    screen.getByRole("button", { name: "Открыть заказ #42" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(navigateMock).toHaveBeenCalledWith("/orders/42");
  });

  it("opens an order websocket for the active order id", async () => {
    const { createOrderWebSocket } = await import("../../services/api");
    storeState = makeStore({ id: "ws-order", display_id: 5, status: "PENDING" });
    renderAt();
    expect(createOrderWebSocket).toHaveBeenCalledWith("ws-order", expect.any(Function));
  });

  it("clears the active order when the socket reports a terminal status", async () => {
    const { createOrderWebSocket } = await import("../../services/api");
    const closeMock = vi.fn();
    (createOrderWebSocket as unknown as Mock).mockReturnValueOnce({
      close: closeMock,
    });
    storeState = makeStore({ id: "ws-order", display_id: 5, status: "PENDING" });
    renderAt();
    const onMessage = (createOrderWebSocket as unknown as Mock).mock
      .calls[0]?.[1] as (d: Record<string, unknown>) => void;

    onMessage({ status: "COMPLETED" });

    expect(storeState.clearActiveOrder).toHaveBeenCalledTimes(1);
    expect(storeState.setActiveOrder).not.toHaveBeenCalled();
  });

  it("updates the active order status from a socket status message", async () => {
    const { createOrderWebSocket } = await import("../../services/api");
    (createOrderWebSocket as unknown as Mock).mockReturnValueOnce({
      close: vi.fn(),
    });
    storeState = makeStore({ id: "ws-order", display_id: 5, status: "PENDING" });
    renderAt();
    const onMessage = (createOrderWebSocket as unknown as Mock).mock
      .calls[0]?.[1] as (d: Record<string, unknown>) => void;

    onMessage({ status: "READY" });

    expect(storeState.setActiveOrder).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ws-order", status: "READY" }),
    );
    expect(storeState.clearActiveOrder).not.toHaveBeenCalled();
  });

  it("ignores a socket message without a string status", async () => {
    const { createOrderWebSocket } = await import("../../services/api");
    (createOrderWebSocket as unknown as Mock).mockReturnValueOnce({
      close: vi.fn(),
    });
    storeState = makeStore({ id: "ws-order", display_id: 5, status: "PENDING" });
    renderAt();
    const onMessage = (createOrderWebSocket as unknown as Mock).mock
      .calls[0]?.[1] as (d: Record<string, unknown>) => void;

    onMessage({ status: 42 });

    expect(storeState.setActiveOrder).not.toHaveBeenCalled();
    expect(storeState.clearActiveOrder).not.toHaveBeenCalled();
  });

  it("closes and drops the socket when the active order disappears", async () => {
    const { createOrderWebSocket } = await import("../../services/api");
    const closeMock = vi.fn();
    (createOrderWebSocket as unknown as Mock).mockReturnValueOnce({
      close: closeMock,
    });
    storeState = makeStore({ id: "ws-order", display_id: 5, status: "PENDING" });
    const { rerender } = renderAt();

    storeState = makeStore(null);
    rerender(
      <MemoryRouter initialEntries={["/"]}>
        <ActiveOrderBanner />
      </MemoryRouter>,
    );

    expect(closeMock).toHaveBeenCalled();
  });
});
