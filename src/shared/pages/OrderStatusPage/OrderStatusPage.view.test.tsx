import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t } from "@shared/i18n/useTranslation";
import { mocks, makeOrder, createOrderWebSocket, resetOrderStatusMocks } from "./orderStatusPageTestMocks";
import { renderPage } from "./orderStatusPageTestUtils";

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

const { storeState } = mocks;

describe("OrderStatusPage view", () => {
  beforeEach(resetOrderStatusMocks);

  it("renders the loading skeleton while there is no current order", () => {
    renderPage();
    expect(screen.getByRole("status", { name: t("order.status.loadingLabel") })).toBeInTheDocument();
  });

  it("opens the websocket and fetches the order on mount", () => {
    renderPage();
    expect(storeState.fetchOrder).toHaveBeenCalledWith("77");
    expect(createOrderWebSocket).toHaveBeenCalled();
  });

  it("renders order number, status pill and details once loaded", () => {
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage();
    expect(screen.getByText("#77")).toBeInTheDocument();
    expect(screen.getByText(t("enums.orderStatusCustomer.ACCEPTED"))).toBeInTheDocument();
    expect(screen.getByTestId("horizontal-steps")).toBeInTheDocument();
    expect(screen.getByText(t("order.details.composition"))).toBeInTheDocument();
    expect(screen.getByText("Бургер")).toBeInTheDocument();
  });

  it("shows the cancellation reason for cancelled orders", () => {
    storeState.currentOrder = makeOrder("CANCELLED", { cancellation_reason: "Нет продуктов" });
    renderPage();
    expect(screen.getByText("Нет продуктов")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("order.status.repeat") })).toBeInTheDocument();
  });

  it("renders a back button", () => {
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage();
    expect(screen.getByRole("button", { name: new RegExp(t("order.status.backToOrders")) })).toBeInTheDocument();
  });

  it("hides order details when showDetails is false", () => {
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage({ showDetails: false });
    expect(screen.queryByText(t("order.details.composition"))).not.toBeInTheDocument();
  });

  it("invokes a function onBack when the back button is pressed", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage({ onBack });
    await user.click(screen.getByRole("button", { name: new RegExp(t("order.status.backToOrders")) }));
    expect(onBack).toHaveBeenCalled();
  });

  it("navigates for a string onBack path", async () => {
    const user = userEvent.setup();
    storeState.currentOrder = makeOrder("ACCEPTED");
    renderPage({ onBack: "/orders" });
    await user.click(screen.getByRole("button", { name: new RegExp(t("order.status.backToOrders")) }));
    expect(createOrderWebSocket).toHaveBeenCalled();
  });

  it("shows the bon appetit note once for a completed order", () => {
    storeState.currentOrder = makeOrder("COMPLETED", {
      requested_pickup_at: "2026-01-15T13:00:00Z",
    });
    renderPage();
    expect(screen.getByText(t("order.status.bonAppetit"))).toBeInTheDocument();
    const pickupPhrase = t("order.status.pickupAt", { time: "" }).replace("·", "").trim();
    expect(screen.getByText(new RegExp(pickupPhrase))).toBeInTheDocument();
  });

  it("shows a load error in the skeleton when the fetch fails", async () => {
    storeState.currentOrder = null;
    storeState.fetchOrder = vi.fn().mockRejectedValue(new Error("boom"));
    renderPage();
    expect(
      await screen.findByText(t("order.status.loadFailed")),
    ).toBeInTheDocument();
  });

  it("renders item options and hides the restaurant card when unnamed", () => {
    storeState.currentOrder = makeOrder("ACCEPTED", {
      restaurant_name: "",
      restaurant_address: "",
      items: [
        {
          id: "i1",
          menu_item_name: "Пицца",
          quantity: 2,
          price_at_purchase: 300,
          selected_options: [{ name: "Сыр", price_delta: 50 }],
        },
      ],
    } as never);
    renderPage();
    expect(screen.getByText(/Сыр/)).toBeInTheDocument();
  });

  it("renders the restaurant card with name and address", () => {
    storeState.currentOrder = makeOrder("ACCEPTED", {
      restaurant_name: "Кафе",
      restaurant_address: "ул. Мира, 5",
    });
    renderPage();
    expect(screen.getByText("Кафе")).toBeInTheDocument();
    expect(screen.getByText("ул. Мира, 5")).toBeInTheDocument();
  });
});
