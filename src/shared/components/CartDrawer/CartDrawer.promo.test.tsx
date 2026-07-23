import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t } from "@shared/i18n/useTranslation";
import { mocks, resetCartDrawerMocks } from "./cartDrawerTestMocks";
import { renderDrawer } from "./cartDrawerTestUtils";

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

describe("CartDrawer promo codes", () => {
  beforeEach(resetCartDrawerMocks);

  it("validates a promo code and uppercases the input", async () => {
    mocks.validate.mockResolvedValue({
      data: {
        data: {
          code: "SALE",
          discount_type: "PERCENT",
          discount_value: 10,
          discounted_amount: 270,
        },
      },
    });
    renderDrawer();
    const input = screen.getByPlaceholderText<HTMLInputElement>(t("order.cart.promoPlaceholder"));
    fireEvent.change(input, { target: { value: "sale" } });
    expect(input.value).toBe("SALE");
    fireEvent.click(screen.getByRole("button", { name: t("common.actions.apply") }));
    await waitFor(() =>
      { expect(mocks.validate).toHaveBeenCalledWith("SALE", "rest-1", 300, true); },
    );
  });

  it("applies a promo via the Enter key", async () => {
    mocks.validate.mockResolvedValue({
      data: { data: { code: "X", discount_type: "FIXED", discount_value: 5 } },
    });
    renderDrawer();
    const input = screen.getByPlaceholderText(t("order.cart.promoPlaceholder"));
    fireEvent.change(input, { target: { value: "x" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => { expect(mocks.validate).toHaveBeenCalled(); });
  });

  it("shows an error for an invalid promo", async () => {
    mocks.validate.mockRejectedValue({ response: { data: { detail: "Неверный промокод" } } });
    renderDrawer();
    fireEvent.change(screen.getByPlaceholderText(t("order.cart.promoPlaceholder")), {
      target: { value: "bad" },
    });
    fireEvent.click(screen.getByRole("button", { name: t("common.actions.apply") }));
    await screen.findByText(t("order.cart.promoInvalid"));
  });
});
