import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t } from "@shared/i18n/useTranslation";
import { mocks, line, resetCartDrawerMocks } from "./cartDrawerTestMocks";
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

describe("CartDrawer cart operations", () => {
  beforeEach(resetCartDrawerMocks);

  it("renders nothing when the cart is empty", () => {
    mocks.cartState.cart = [];
    const { container } = renderDrawer();
    expect(container.firstChild).toBeNull();
  });

  it("renders items, total and the order button", async () => {
    renderDrawer();
    expect(screen.getByText(t("order.cart.title"))).toBeInTheDocument();
    expect(screen.getByText("Пицца")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: t("order.checkout.submit", { total: "300 ₽" }) }),
    ).toBeInTheDocument();
    await waitFor(() => { expect(mocks.getEstimate).toHaveBeenCalled(); });
  });

  it("renders selected option summaries on a line", () => {
    mocks.cartState.cart = [
      line({
        selectedOptionIds: ["o1"],
        selectedOptions: [{ option_id: "o1", id: "o1", name: "Сыр", price_delta: 50 }],
      }),
    ];
    renderDrawer();
    expect(screen.getByText(/Сыр/)).toBeInTheDocument();
  });

  it("increments and decrements a line", () => {
    renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: t("order.cart.increase") }));
    fireEvent.click(screen.getByRole("button", { name: t("order.cart.decrease") }));
    expect(mocks.cartState.addToCart).toHaveBeenCalled();
    expect(mocks.cartState.removeFromCart).toHaveBeenCalled();
  });

  it("edits the order comment and switches pickup mode back to asap", () => {
    renderDrawer();
    const textarea = screen.getByPlaceholderText(t("order.cart.commentPlaceholder"));
    fireEvent.change(textarea, { target: { value: "без лука" } });
    expect((textarea as HTMLTextAreaElement).value).toBe("без лука");
    fireEvent.click(screen.getByRole("button", { name: t("order.pickup.scheduled") }));
    fireEvent.click(screen.getByRole("button", { name: t("order.pickup.asap") }));
    expect(screen.queryByText(minimumMatcher)).not.toBeInTheDocument();
  });

  it("closes when clicking the overlay outside the drawer", () => {
    const onClose = vi.fn();
    const { container } = renderDrawer({ onClose });
    fireEvent.click(container.firstChild as Element);
    expect(onClose).toHaveBeenCalled();
  });

  it("clears the cart", () => {
    renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: t("order.cart.clear") }));
    expect(mocks.cartState.clearCart).toHaveBeenCalled();
  });
});
