import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { t } from "@shared/i18n/useTranslation";
import { formatPrice } from "@shared/utils/price";
import { mocks, resetCartDrawerMocks, loyaltyStatus, punchStatus } from "./cartDrawerTestMocks";
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

describe("CartDrawer loyalty", () => {
  beforeEach(resetCartDrawerMocks);

  it("skips the loyalty request for anonymous users", async () => {
    renderDrawer();
    await waitFor(() => { expect(mocks.getEstimate).toHaveBeenCalled(); });
    expect(mocks.getStatus).not.toHaveBeenCalled();
  });

  it("caps the redeemed points input and reflects the discount in the total", async () => {
    mocks.authState.user = { permissions: ["loyalty.read"] };
    mocks.getStatus.mockResolvedValue({ data: { data: loyaltyStatus() } });
    renderDrawer();
    const input = await screen.findByLabelText<HTMLInputElement>(t("loyalty.checkout.redeemLabel"));
    expect(mocks.getStatus).toHaveBeenCalledWith("rest-1");
    expect(
      screen.getByText(t("loyalty.checkout.maxHint", { max: formatPrice(150) })),
    ).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "500" } });
    expect(input.value).toBe("150");
    expect(
      screen.getByRole("button", { name: t("order.checkout.submit", { total: formatPrice(150) }) }),
    ).toBeInTheDocument();
    expect(screen.getByText(t("loyalty.checkout.pointsWillBeDeducted"))).toBeInTheDocument();
    expect(
      screen.getByText(t("loyalty.checkout.cashbackHint", { percent: 5 })),
    ).toBeInTheDocument();
  });

  it("passes the redeemed points to placeOrder", async () => {
    mocks.authState.user = { permissions: ["loyalty.read"] };
    mocks.getStatus.mockResolvedValue({ data: { data: loyaltyStatus() } });
    renderDrawer();
    const input = await screen.findByLabelText(t("loyalty.checkout.redeemLabel"));
    fireEvent.change(input, { target: { value: "100" } });
    fireEvent.click(
      screen.getByRole("button", { name: t("order.checkout.submit", { total: formatPrice(200) }) }),
    );
    await waitFor(() => {
      expect(mocks.cartState.placeOrder).toHaveBeenCalledWith(null, "", null, 100, null);
    });
  });

  it("disables a FREE_ITEM reward when the item is not in the cart and shows a hint", async () => {
    mocks.authState.user = { permissions: ["loyalty.read"] };
    mocks.getStatus.mockResolvedValue({
      data: {
        data: punchStatus({
          rewards: [
            {
              id: "rw1",
              reward_type: "FREE_ITEM",
              reward_value: null,
              reward_menu_item_id: "m-absent",
              status: "AVAILABLE",
              created_at: "2026-01-01T00:00:00Z",
            },
            {
              id: "rw2",
              reward_type: "DISCOUNT_FIXED",
              reward_value: 50,
              reward_menu_item_id: null,
              status: "AVAILABLE",
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
        }),
      },
    });
    renderDrawer();
    const select = await screen.findByLabelText<HTMLSelectElement>(
      t("loyalty.checkout.applyReward"),
    );
    const freeItemOption = screen.getByRole("option", {
      name: t("loyalty.rewardType.FREE_ITEM"),
    });
    expect(freeItemOption).toBeDisabled();
    expect(screen.getByText(t("loyalty.checkout.rewardItemNotInCart"))).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "rw2" } });
    fireEvent.click(
      screen.getByRole("button", { name: t("order.checkout.submit", { total: formatPrice(300) }) }),
    );
    await waitFor(() => {
      expect(mocks.cartState.placeOrder).toHaveBeenCalledWith(null, "", null, 0, "rw2");
    });
  });

  it("labels an applicable FREE_ITEM reward with the cart item name", async () => {
    mocks.authState.user = { permissions: ["loyalty.read"] };
    mocks.getStatus.mockResolvedValue({
      data: {
        data: punchStatus({
          rewards: [
            {
              id: "rw1",
              reward_type: "FREE_ITEM",
              reward_value: null,
              reward_menu_item_id: "m1",
              status: "AVAILABLE",
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
        }),
      },
    });
    renderDrawer();
    await screen.findByLabelText(t("loyalty.checkout.applyReward"));
    expect(
      screen.getByRole("option", {
        name: t("loyalty.rewardDescription.FREE_ITEM", { item: "Пицца" }),
      }),
    ).not.toBeDisabled();
    expect(
      screen.queryByText(t("loyalty.checkout.rewardItemNotInCart")),
    ).not.toBeInTheDocument();
  });
});
