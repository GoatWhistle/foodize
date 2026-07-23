import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t } from "@shared/i18n/useTranslation";
import { mocks, makeOrder, createOrderWebSocket, resetOrderStatusMocks } from "./orderStatusPageTestMocks";
import { renderPage } from "./orderStatusPageTestUtils";
import { OrderStatusPage } from "@shared/pages/OrderStatusPage/OrderStatusPage";

vi.mock("@shared/store/useOrdersStore.instance", async () => {
  const { mocks } = await import("./orderStatusPageTestMocks");
  return { useOrdersStore: mocks.useOrdersStore };
});
vi.mock("@shared/store/useCartStore.instance", async () => {
  const { mocks } = await import("./orderStatusPageTestMocks");
  return { useCartStore: mocks.useCartStore };
});
vi.mock("@shared/services/orderService", async () => {
  const { mocks } = await import("./orderStatusPageTestMocks");
  return {
    orderService: {
      completeOrder: (...args: unknown[]) => mocks.completeOrder(...args) as unknown,
      cancelOrder: (...args: unknown[]) => mocks.cancelOrder(...args) as unknown,
    },
  };
});
vi.mock("@shared/hooks/useEtaText", () => ({
  useEtaState: () => ({ text: "Готовность через 10 мин", delayed: false }),
}));
vi.mock("@shared/components/HorizontalSteps/HorizontalSteps", () => ({
  HorizontalSteps: () => <div data-testid="horizontal-steps" />,
}));

const { storeState, completeOrder, cancelOrder } = mocks;

describe("OrderStatusPage actions", () => {
  beforeEach(resetOrderStatusMocks);

  it("shows the ready call-to-action and completes the order", async () => {
    const user = userEvent.setup();
    storeState.currentOrder = makeOrder("READY");
    renderPage();
    expect(screen.getByText(t("order.status.readyCallout"))).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t("order.status.confirmReceipt") }));
    expect(completeOrder).toHaveBeenCalledWith("77");
  });

  it("shows a cancel button for pending orders and cancels", async () => {
    const user = userEvent.setup();
    storeState.currentOrder = makeOrder("PENDING");
    renderPage();
    await user.click(screen.getByRole("button", { name: t("order.status.cancel") }));
    expect(cancelOrder).toHaveBeenCalledWith("77", null);
  });

  it("repeats a completed order and navigates to the restaurant", async () => {
    const user = userEvent.setup();
    const repeatOrder = vi.fn().mockResolvedValue(undefined);
    mocks.useCartStore.getState = () => ({ repeatOrder });
    storeState.currentOrder = makeOrder("COMPLETED", {
      restaurant_display_id: "R1",
    });
    renderPage();
    await user.click(screen.getByRole("button", { name: t("order.status.repeat") }));
    expect(repeatOrder).toHaveBeenCalled();
  });

  it("shows an error when completing the order fails", async () => {
    const user = userEvent.setup();
    completeOrder.mockRejectedValueOnce(new Error("boom"));
    storeState.currentOrder = makeOrder("READY");
    renderPage();
    await user.click(screen.getByRole("button", { name: t("order.status.confirmReceipt") }));
    expect(
      await screen.findByText(t("order.status.confirmFailed")),
    ).toBeInTheDocument();
  });

  it("shows an error when cancelling the order fails", async () => {
    const user = userEvent.setup();
    cancelOrder.mockRejectedValueOnce(new Error("boom"));
    storeState.currentOrder = makeOrder("PENDING");
    renderPage();
    await user.click(screen.getByRole("button", { name: t("order.status.cancel") }));
    expect(
      await screen.findByText(t("order.status.cancelFailed")),
    ).toBeInTheDocument();
  });

  it("updates the order from a websocket message and ignores error frames", () => {
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage();
    const call = createOrderWebSocket.mock.calls[0] as unknown as unknown[];
    const onMessage = call[1] as (d: Record<string, unknown>) => void;
    onMessage({ error: "boom" });
    onMessage({ id: "o1", display_id: 77, status: "READY" });
    expect(storeState.currentOrder.status).toBe("READY");
  });

  it("reloads the order on websocket close for non-terminal statuses", () => {
    const fetchOrder = vi.fn().mockResolvedValue(undefined);
    storeState.fetchOrder = fetchOrder;
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage();
    fetchOrder.mockClear();
    const closeCall = createOrderWebSocket.mock.calls[0] as unknown as unknown[];
    const onClose = closeCall[2] as () => void;
    onClose();
    expect(fetchOrder).toHaveBeenCalled();
  });

  it("fires haptic feedback on a status change", () => {
    const impactOccurred = vi.fn();
    (window as unknown as { Telegram?: unknown }).Telegram = {
      WebApp: { HapticFeedback: { impactOccurred } },
    };
    storeState.currentOrder = makeOrder("ACCEPTED");
    const { rerender } = renderPage();
    storeState.currentOrder = makeOrder("READY");
    rerender(
      <MemoryRouter initialEntries={["/orders/77"]}>
        <Routes>
          <Route
            path="/orders/:id"
            element={
              <OrderStatusPage createOrderWebSocket={createOrderWebSocket} />
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    delete (window as unknown as { Telegram?: unknown }).Telegram;
  });
});
