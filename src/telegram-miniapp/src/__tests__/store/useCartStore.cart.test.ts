import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { useCartStore } from "../../store/useCartStore";
import { cartService } from "@shared/services/cartService";
import type { CartLine } from "@shared/store/createCartStore";

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

const cartServiceMock = cartService as unknown as {
  getCart: Mock;
  updateCart: Mock;
  clearCart: Mock;
};

const asCartLines = (lines: Partial<CartLine>[]): CartLine[] =>
  lines as CartLine[];

describe("useCartStore cart", () => {
  beforeEach(() => {
    useCartStore.setState({
      cart: [],
      cartRestaurantId: null,
      cartError: null,
      orderPlacing: false,
    });
    vi.clearAllMocks();
  });

  it("should fetch cart successfully", async () => {
    cartServiceMock.getCart.mockResolvedValueOnce({
      data: {
        data: {
          items: [
            {
              menuItem: { id: "m1", name: "Pizza", price: 100 },
              quantity: 2,
              selected_options: [],
              selected_option_ids: [],
            },
          ],
          restaurant_id: "rest-1",
        },
      },
    });

    await useCartStore.getState().fetchCart();

    const state = useCartStore.getState();
    expect(state.cart.length).toBe(1);
    expect(state.cartRestaurantId).toBe("rest-1");
  });

  it("normalizes snake_case cart items to camelCase on fetch", async () => {
    cartServiceMock.getCart.mockResolvedValueOnce({
      data: {
        data: {
          items: [
            {
              menuItem: { id: "m1", name: "Pizza", price: 100 },
              quantity: 1,
              selected_option_ids: ["o1"],
              selected_options: [
                { option_id: "o1", name: "Cheese", price_delta: 15 },
              ],
            },
          ],
          restaurant_id: "rest-1",
        },
      },
    });

    await useCartStore.getState().fetchCart();

    const line = useCartStore.getState().cart[0];
    if (!line) throw new Error("cart line not found");
    expect(line.selectedOptionIds).toEqual(["o1"]);
    expect(line.selectedOptions).toEqual([
      { id: "o1", option_id: "o1", name: "Cheese", price_delta: 15 },
    ]);
    expect(line.lineKey).toBe("m1:o1");
    expect(useCartStore.getState().cartTotal()).toBe(115);
  });

  it("should add to cart successfully when cart is empty", async () => {
    cartServiceMock.updateCart.mockResolvedValueOnce({});
    const menuItem = { id: "m1", name: "Pizza", price: 100 };

    await useCartStore.getState().addToCart(menuItem, "rest-1", [], 2);

    const state = useCartStore.getState();
    expect(state.cart.length).toBe(1);
    expect(state.cart[0]?.menuItem).toEqual(menuItem);
    expect(state.cart[0]?.quantity).toBe(2);
    expect(state.cartRestaurantId).toBe("rest-1");
    expect(cartServiceMock.updateCart).toHaveBeenCalled();
  });

  it("should increment quantity when adding the same item", async () => {
    cartServiceMock.updateCart.mockResolvedValue({});
    const menuItem = { id: "m1", name: "Pizza", price: 100 };

    useCartStore.setState({
      cart: [
        {
          menuItem,
          quantity: 2,
          selectedOptionIds: [],
          selectedOptions: [],
          lineKey: "m1:",
        },
      ],
      cartRestaurantId: "rest-1",
    });

    await useCartStore.getState().addToCart(menuItem, "rest-1", [], 3);

    const state = useCartStore.getState();
    expect(state.cart[0]?.quantity).toBe(5);
  });

  it("should confirm and replace cart if adding item from a different restaurant", async () => {
    window.confirm = vi.fn(() => true);
    cartServiceMock.updateCart.mockResolvedValue({});
    const oldItem = { id: "m1", name: "Pizza", price: 100 };
    const newItem = { id: "m2", name: "Burger", price: 50 };

    useCartStore.setState({
      cart: [
        {
          menuItem: oldItem,
          quantity: 2,
          selectedOptionIds: [],
          selectedOptions: [],
          lineKey: "m1:",
        },
      ],
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
      cart: [
        {
          menuItem: oldItem,
          quantity: 1,
          selectedOptionIds: [],
          selectedOptions: [],
          lineKey: "m1:",
        },
      ],
      cartRestaurantId: "rest-1",
    });

    await useCartStore.getState().addToCart(newItem, "rest-2", [], 1);

    expect(showConfirm).toHaveBeenCalledWith(
      "Заменить корзину?\nТекущие товары будут удалены.",
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
      cart: [
        {
          menuItem: oldItem,
          quantity: 2,
          selectedOptionIds: [],
          selectedOptions: [],
          lineKey: "m1:",
        },
      ],
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
      cart: [
        {
          menuItem,
          quantity: 1,
          selectedOptionIds: [],
          selectedOptions: [],
          lineKey: "m1:",
        },
      ],
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
      cart: [
        {
          menuItem,
          quantity: 2,
          selectedOptionIds: [],
          selectedOptions: [],
          lineKey: "m1:",
        },
      ],
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
