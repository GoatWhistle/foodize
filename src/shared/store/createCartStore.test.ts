import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Order } from "@shared/types/models";
import type { CartMenuItem } from "@shared/utils/cartLine";

const mocks = vi.hoisted(() => ({
  getCart: vi.fn(),
  updateCart: vi.fn(),
  clearCart: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@shared/services/cartService", () => ({
  cartService: { getCart: mocks.getCart, updateCart: mocks.updateCart, clearCart: mocks.clearCart },
}));

vi.mock("@shared/services/orderService", () => ({
  orderService: { create: mocks.create },
}));

vi.mock("@shared/utils/translateApiError", () => ({
  translateApiError: (_e: unknown, fallback: string) => fallback,
}));

vi.mock("@shared/utils/logError", () => ({ logError: vi.fn() }));

import { createCartStore } from "./createCartStore";
import { t } from "@shared/i18n/useTranslation";

const menuItem = (id: string, price = 100): CartMenuItem =>
  (({ id, name: `M${id}`, price }));

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.updateCart.mockResolvedValue(undefined);
  mocks.clearCart.mockResolvedValue(undefined);
});

describe("createCartStore", () => {
  it("addToCart adds a line and syncs", async () => {
    const store = createCartStore();
    await store.getState().addToCart(menuItem("1"), "r1");
    expect(store.getState().cart).toHaveLength(1);
    expect(store.getState().cartRestaurantId).toBe("r1");
    expect(mocks.updateCart).toHaveBeenCalled();
  });

  it("addToCart merges quantity for the same line", async () => {
    const store = createCartStore();
    await store.getState().addToCart(menuItem("1"), "r1");
    await store.getState().addToCart(menuItem("1"), "r1");
    expect(store.getState().cart).toHaveLength(1);
    expect(store.getState().cart[0]?.quantity).toBe(2);
  });

  it("addToCart asks to replace when switching restaurants and aborts if declined", async () => {
    const onRestaurantChange = vi.fn().mockResolvedValue(false);
    const store = createCartStore({ onRestaurantChange });
    await store.getState().addToCart(menuItem("1"), "r1");
    const result = await store.getState().addToCart(menuItem("2"), "r2");
    expect(result).toBe(false);
    expect(store.getState().cartRestaurantId).toBe("r1");
  });

  it("addToCart replaces the cart when the restaurant change is confirmed", async () => {
    const onRestaurantChange = vi.fn().mockResolvedValue(true);
    const store = createCartStore({ onRestaurantChange });
    await store.getState().addToCart(menuItem("1"), "r1");
    await store.getState().addToCart(menuItem("2"), "r2");
    expect(store.getState().cartRestaurantId).toBe("r2");
    expect(store.getState().cart).toHaveLength(1);
  });

  it("removeFromCart decrements and clears server cart when empty", async () => {
    const store = createCartStore();
    await store.getState().addToCart(menuItem("1"), "r1");
    await store.getState().removeFromCart("1", []);
    expect(store.getState().cart).toHaveLength(0);
    expect(mocks.clearCart).toHaveBeenCalled();
  });

  it("clearCart empties state and calls the service", async () => {
    const store = createCartStore();
    await store.getState().addToCart(menuItem("1"), "r1");
    await store.getState().clearCart();
    expect(store.getState().cart).toEqual([]);
    expect(store.getState().cartRestaurantId).toBeNull();
    expect(mocks.clearCart).toHaveBeenCalled();
  });

  it("cartTotal and cartCount aggregate lines", async () => {
    const store = createCartStore();
    await store.getState().addToCart(menuItem("1", 150), "r1", [], 2);
    expect(store.getState().cartCount()).toBe(2);
    expect(store.getState().cartTotal()).toBe(300);
  });

  it("fetchCart loads and normalizes the server cart", async () => {
    mocks.getCart.mockResolvedValue({
      data: { data: { items: [], restaurant_id: "r9" } },
    });
    const store = createCartStore();
    await store.getState().fetchCart();
    expect(store.getState().cartRestaurantId).toBe("r9");
  });

  it("fetchCart sets an error on failure", async () => {
    mocks.getCart.mockRejectedValue(new Error("net"));
    const store = createCartStore();
    await store.getState().fetchCart();
    expect(store.getState().cartError).toBe(t("order.cart.loadFailed"));
  });

  it("placeOrder returns undefined when there is no restaurant", async () => {
    const store = createCartStore();
    const result = await store.getState().placeOrder();
    expect(result).toBeUndefined();
    expect(store.getState().orderPlacing).toBe(false);
  });

  it("placeOrder creates an order, clears the cart and notifies", async () => {
    const created = { id: "o1" } as unknown as Order;
    mocks.create.mockResolvedValue({ data: { data: created } });
    const onOrderPlaced = vi.fn();
    const store = createCartStore({ onOrderPlaced });
    await store.getState().addToCart(menuItem("1"), "r1");
    const result = await store.getState().placeOrder("PROMO", "  hi  ");
    expect(result).toEqual(created);
    expect(onOrderPlaced).toHaveBeenCalledWith(created);
    expect(store.getState().cart).toEqual([]);
  });

  it("placeOrder resets orderPlacing and rethrows on failure", async () => {
    mocks.create.mockRejectedValue(new Error("boom"));
    const store = createCartStore();
    await store.getState().addToCart(menuItem("1"), "r1");
    await expect(store.getState().placeOrder()).rejects.toThrow("boom");
    expect(store.getState().orderPlacing).toBe(false);
  });

  it("addToCart with selected options normalizes option ids", async () => {
    const store = createCartStore();
    await store
      .getState()
      .addToCart(menuItem("1"), "r1", [
        { id: "o1", name: "Соус", price_delta: 20 },
      ]);
    const line = store.getState().cart[0];
    expect(line?.selectedOptionIds).toEqual(["o1"]);
    expect(line?.selectedOptions[0]).toMatchObject({ option_id: "o1", name: "Соус" });
  });

  it("removeFromCart decrements without clearing when items remain", async () => {
    const store = createCartStore();
    await store.getState().addToCart(menuItem("1"), "r1", [], 2);
    await store.getState().addToCart(menuItem("2"), "r1");
    mocks.updateCart.mockClear();
    await store.getState().removeFromCart("1", []);
    expect(store.getState().cart).toHaveLength(2);
    expect(mocks.clearCart).not.toHaveBeenCalled();
    expect(mocks.updateCart).toHaveBeenCalled();
  });

  it("_syncCart records an error when the update fails", async () => {
    const store = createCartStore();
    await store.getState().addToCart(menuItem("1"), "r1");
    mocks.updateCart.mockRejectedValueOnce(new Error("sync"));
    await store.getState()._syncCart();
    expect(store.getState().cartError).toBe(
      t("order.cart.syncFailed"),
    );
  });

  it("_syncCart is a no-op when there is no restaurant", async () => {
    const store = createCartStore();
    mocks.updateCart.mockClear();
    await store.getState()._syncCart();
    expect(mocks.updateCart).not.toHaveBeenCalled();
  });

  it("placeOrder ignores a second concurrent call while placing", async () => {
    let resolveCreate: ((v: unknown) => void) | null = null;
    mocks.create.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    const store = createCartStore();
    await store.getState().addToCart(menuItem("1"), "r1");
    const first = store.getState().placeOrder();
    const second = await store.getState().placeOrder();
    expect(second).toBeUndefined();
    (resolveCreate as ((v: unknown) => void) | null)?.({
      data: { data: { id: "o1" } },
    });
    await first;
  });

  it("placeOrder forwards promo, comment and pickup time", async () => {
    mocks.create.mockResolvedValue({ data: { data: { id: "o1" } } });
    const store = createCartStore();
    await store.getState().addToCart(menuItem("1"), "r1");
    await store
      .getState()
      .placeOrder("SAVE", "extra sauce", "2026-01-01T10:00:00Z");
    const payload = mocks.create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload["promo_code"]).toBe("SAVE");
    expect(payload["comment"]).toBe("extra sauce");
    expect(payload["requested_pickup_at"]).toBe("2026-01-01T10:00:00Z");
  });

  it("repeatOrder pushes order items to the cart", async () => {
    mocks.getCart.mockResolvedValue({
      data: { data: { items: [], restaurant_id: "r2" } },
    });
    const store = createCartStore();
    const order = {
      restaurant_id: "r2",
      items: [{ menu_item_id: "1", quantity: 1, selected_options: [] }],
    } as unknown as Order;
    await store.getState().repeatOrder(order);
    expect(mocks.updateCart).toHaveBeenCalled();
    expect(mocks.getCart).toHaveBeenCalled();
  });
});

describe("createCartStore option normalization", () => {
  it("keeps option_id, name and price_delta when they are present", async () => {
    const store = createCartStore();
    await store
      .getState()
      .addToCart(menuItem("1"), "r1", [{ id: "o1", name: "Сыр", price_delta: 50 }], 2);
    const line = store.getState().cart[0];
    expect(line?.selectedOptionIds).toEqual(["o1"]);
    expect(line?.selectedOptions[0]).toMatchObject({
      option_id: "o1",
      id: "o1",
      name: "Сыр",
      price_delta: 50,
    });
    expect(line?.quantity).toBe(2);
  });

  it("omits absent option fields and drops options without an id", async () => {
    const store = createCartStore();
    await store.getState().addToCart(menuItem("2"), "r1", [{ name: "Без id" }], 0);
    const line = store.getState().cart[0];
    expect(line?.selectedOptionIds).toEqual([]);
    expect(line?.quantity).toBe(1);
  });

  it("falls back to option_id when id is missing", async () => {
    const store = createCartStore();
    await store.getState().addToCart(menuItem("3"), "r1", [{ option_id: "o9" }]);
    expect(store.getState().cart[0]?.selectedOptionIds).toEqual(["o9"]);
  });
});
