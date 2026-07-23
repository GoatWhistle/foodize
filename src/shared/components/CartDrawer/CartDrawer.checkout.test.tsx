import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t } from "@shared/i18n/useTranslation";
import { mocks, resetCartDrawerMocks } from "./cartDrawerTestMocks";
import { renderDrawer, minimumMatcher } from "./cartDrawerTestUtils";

vi.mock("zustand/react/shallow", () => ({ useShallow: (fn: unknown) => fn }));
vi.mock("@shared/store/useCartStore.instance", async () => {
  const { mocks } = await import("./cartDrawerTestMocks");
  return { useCartStore: mocks.useCartStore };
});
vi.mock("@shared/store/useOrdersStore.instance", async () => {
  const { mocks } = await import("./cartDrawerTestMocks");
  return { useOrdersStore: mocks.useOrdersStore };
});
vi.mock("@shared/services/promoService", async () => {
  const { mocks } = await import("./cartDrawerTestMocks");
  return { promoService: { validate: (...a: unknown[]) => mocks.validate(...a) } };
});
vi.mock("@shared/services/orderService", async () => {
  const { mocks } = await import("./cartDrawerTestMocks");
  return { orderService: { getEstimate: (...a: unknown[]) => mocks.getEstimate(...a) } };
});
vi.mock("@shared/services/loyaltyService", async () => {
  const { mocks } = await import("./cartDrawerTestMocks");
  return { loyaltyService: { getStatus: (...a: unknown[]) => mocks.getStatus(...a) } };
});
vi.mock("@shared/store/useAuthStore.instance", async () => {
  const { mocks } = await import("./cartDrawerTestMocks");
  return { useAuthStore: mocks.useAuthStore };
});
vi.mock("@shared/hooks/useFocusTrap", async () => {
  const { useRef } = await vi.importActual<typeof import("react")>("react");
  return { useFocusTrap: () => useRef(null) };
});

describe("CartDrawer checkout and estimates", () => {
  beforeEach(resetCartDrawerMocks);

  it("shows an error when placing an order fails", async () => {
    mocks.cartState.placeOrder.mockRejectedValueOnce(new Error("boom"));
    renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: t("order.checkout.submit", { total: "300 ₽" }) }));
    await screen.findByText(t("order.checkout.failed"));
  });

  it("places an order and navigates", async () => {
    renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: t("order.checkout.submit", { total: "300 ₽" }) }));
    await waitFor(() => { expect(mocks.cartState.placeOrder).toHaveBeenCalled(); });
  });

  it("blocks ordering and shows an error when the restaurant is closed", () => {
    renderDrawer({ isRestaurantOpen: false });
    expect(
      screen.getByRole("button", { name: t("order.checkout.paused") }),
    ).toBeDisabled();
  });

  it("shows the queue estimate and disables ordering when unavailable", async () => {
    mocks.getEstimate.mockResolvedValue({
      data: {
        data: {
          restaurant_id: "rest-1",
          ordering_available: false,
          estimated_wait_min_minutes: 20,
          estimated_wait_max_minutes: 30,
          avg_prep_time_minutes: 10,
          active_orders_count: 8,
          max_active_orders: 5,
        },
      },
    });
    renderDrawer();
    await screen.findByText(t("order.estimate.unavailable"));
    expect(
      screen.getByRole("button", { name: t("order.checkout.paused") }),
    ).toBeDisabled();
  });

  it("switches to a scheduled pickup time and validates a too-soon value", () => {
    renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: t("order.pickup.scheduled") }));
    expect(screen.getByText(minimumMatcher)).toBeInTheDocument();
    const input = document.querySelector(
      'input[type="datetime-local"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2000-01-01T00:00" } });
    expect(
      screen.getByRole("button", { name: t("order.checkout.submit", { total: "300 ₽" }) }),
    ).toBeDisabled();
  });

  it("tolerates a failing load estimate request", async () => {
    mocks.getEstimate.mockRejectedValueOnce(new Error("down"));
    renderDrawer();
    await waitFor(() => { expect(mocks.getEstimate).toHaveBeenCalled(); });
    expect(screen.getByText(t("order.checkout.submit", { total: "300 ₽" }))).toBeInTheDocument();
  });

  it("resets the estimate when there is no restaurant id", () => {
    mocks.cartState.cartRestaurantId = null;
    renderDrawer();
    expect(screen.getByText(t("order.cart.title"))).toBeInTheDocument();
  });

  it("shows a queue warning without blocking ordering", async () => {
    mocks.getEstimate.mockResolvedValue({
      data: {
        data: {
          restaurant_id: "rest-1",
          ordering_available: true,
          estimated_wait_min_minutes: 40,
          estimated_wait_max_minutes: 50,
          avg_prep_time_minutes: 10,
          active_orders_count: 3,
          max_active_orders: 10,
        },
      },
    });
    renderDrawer();
    await screen.findByText(t("order.estimate.waitRange", { min: 40, max: 50 }));
    expect(screen.getByText(t("order.estimate.activeInQueue", { count: 3 }))).toBeInTheDocument();
  });
});
