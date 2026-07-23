import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCartStore } from "../../store/useCartStore";
import type { CartLine } from "@shared/store/createCartStore";
import { t } from "@shared/i18n/useTranslation";
import {
  asCartLines,
  cartServiceMock,
  makeLine,
  resetCartStore,
} from "./cartStoreHelpers";

vi.mock("@shared/services/cartService", () => ({
  cartService: {
    getCart: vi.fn(),
    updateCart: vi.fn(),
    clearCart: vi.fn(),
  },
}));

vi.mock("@shared/services/orderService", () => ({
  orderService: {
    create: vi.fn(),
    getMyOrders: vi.fn(),
    getById: vi.fn(),
  },
}));

describe("useCartStore restaurant replacement and removal", () => {
  beforeEach(() => {
    resetCartStore();
    vi.clearAllMocks();
  });

  it("should confirm and replace cart if adding item from a different restaurant", async () => {
    window.confirm = vi.fn(() => true);
    cartServiceMock.updateCart.mockResolvedValue({});
    const oldItem = { id: "m1", name: "Pizza", price: 100 };
    const newItem = { id: "m2", name: "Burger", price: 50 };

    useCartStore.setState({
      cart: [makeLine(oldItem, 2)],
      cartRestaurantId: "rest-1",
    });

    await useCartStore.getState().addToCart(newItem, "rest-2", [], 1);

    const state = useCartStore.getState();
    expect(state.cartRestaurantId).toBe("rest-2");
    expect(state.cart.length).toBe(1);
    expect(state.cart[0]?.menuItem).toEqual(newItem);
  });

  it("uses the Telegram showConfirm dialog when replacing a cart from another restaurant", async () => {
    const showConfirm = vi.fn(
      (_msg: string, cb: (confirmed: boolean) => void) => { cb(true); },
    );
    const prevTelegram = window.Telegram;
    window.Telegram = {
      WebApp: { showConfirm },
    };
    cartServiceMock.updateCart.mockResolvedValue({});
    const oldItem = { id: "m1", name: "Pizza", price: 100 };
    const newItem = { id: "m2", name: "Burger", price: 50 };

    useCartStore.setState({
      cart: [makeLine(oldItem, 1)],
      cartRestaurantId: "rest-1",
    });

    await useCartStore.getState().addToCart(newItem, "rest-2", [], 1);

    expect(showConfirm).toHaveBeenCalledWith(
      t("order.cart.replaceConfirmMultiline"),
      expect.any(Function),
    );
    const state = useCartStore.getState();
    expect(state.cartRestaurantId).toBe("rest-2");
    expect(state.cart[0]?.menuItem).toEqual(newItem);

    window.Telegram = prevTelegram as NonNullable<typeof window.Telegram>;
  });

  it("should not replace cart if different restaurant confirmation is declined", async () => {
    window.confirm = vi.fn(() => false);
    const oldItem = { id: "m1", name: "Pizza", price: 100 };
    const newItem = { id: "m2", name: "Burger", price: 50 };

    useCartStore.setState({
      cart: [makeLine(oldItem, 2)],
      cartRestaurantId: "rest-1",
    });

    const res = await useCartStore
      .getState()
      .addToCart(newItem, "rest-2", [], 1);

    expect(res).toBe(false);
    const state = useCartStore.getState();
    expect(state.cartRestaurantId).toBe("rest-1");
    expect(state.cart.length).toBe(1);
  });

  it("should remove from cart and clear if quantity becomes 0", async () => {
    cartServiceMock.clearCart.mockResolvedValueOnce({});
    const menuItem = { id: "m1", name: "Pizza", price: 100 };

    useCartStore.setState({
      cart: [makeLine(menuItem, 1)],
      cartRestaurantId: "rest-1",
    });

    await useCartStore.getState().removeFromCart("m1", []);

    const state = useCartStore.getState();
    expect(state.cart.length).toBe(0);
    expect(state.cartRestaurantId).toBeNull();
    expect(cartServiceMock.clearCart).toHaveBeenCalled();
  });

  it("should remove from cart and update if quantity is still > 0", async () => {
    cartServiceMock.updateCart.mockResolvedValueOnce({});
    const menuItem = { id: "m1", name: "Pizza", price: 100 };

    useCartStore.setState({
      cart: [makeLine(menuItem, 2)],
      cartRestaurantId: "rest-1",
    });

    await useCartStore.getState().removeFromCart("m1", []);

    const state = useCartStore.getState();
    expect(state.cart.length).toBe(1);
    expect(state.cart[0]?.quantity).toBe(1);
    expect(cartServiceMock.updateCart).toHaveBeenCalled();
  });

  it("should clear cart successfully", async () => {
    cartServiceMock.clearCart.mockResolvedValueOnce({});
    useCartStore.setState({
      cart: asCartLines([{ menuItem: { id: "m1" } as CartLine["menuItem"], quantity: 1 }]),
      cartRestaurantId: "rest-1",
    });

    await useCartStore.getState().clearCart();

    const state = useCartStore.getState();
    expect(state.cart.length).toBe(0);
    expect(state.cartRestaurantId).toBeNull();
  });
});
