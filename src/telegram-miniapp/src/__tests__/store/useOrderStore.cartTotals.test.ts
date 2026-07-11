import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { useOrderStore } from "../../store/useOrderStore";
import { cartService } from "@shared/services/cartService";
import type { CartLine } from "@shared/store/useOrderStore";

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

describe("useOrderStore cart totals", () => {
  beforeEach(() => {
    useOrderStore.setState({
      cart: [],
      cartRestaurantId: null,
      orders: [],
      currentOrder: null,
      ordersLoading: false,
      ordersTotal: 0,
      activeOrder: null,
    });
    vi.clearAllMocks();
  });

  it("should calculate cartTotal and cartCount correctly", () => {
    useOrderStore.setState({
      cart: asCartLines([
        {
          menuItem: { id: "m1", price: 100 } as CartLine["menuItem"],
          quantity: 2,
          selectedOptions: [{ price_delta: 15 }],
        },
        {
          menuItem: { id: "m2", price: 50 } as CartLine["menuItem"],
          quantity: 1,
          selectedOptions: [],
        },
      ]),
    });

    expect(useOrderStore.getState().cartCount()).toBe(3);
    expect(useOrderStore.getState().cartTotal()).toBe(280);
  });

  it("keeps syncing after a failed updateCart (chain not poisoned)", async () => {
    cartServiceMock.updateCart
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({});

    const menuItem = { id: "m1", name: "Pizza", price: 100 } as CartLine["menuItem"];

    await useOrderStore.getState().addToCart(menuItem, "rest-1");
    expect(useOrderStore.getState().cartError).not.toBeNull();

    await useOrderStore.getState().addToCart(menuItem, "rest-1");

    expect(cartServiceMock.updateCart).toHaveBeenCalledTimes(2);
    expect(useOrderStore.getState().cartError).toBeNull();
  });

  it("re-renders selectors of cartCount when cart changes", async () => {
    cartServiceMock.updateCart.mockResolvedValue({});
    cartServiceMock.clearCart.mockResolvedValue({});

    const seen: number[] = [];
    const unsub = useOrderStore.subscribe((s) => {
      seen.push(s.cartCount());
    });

    const menuItem = { id: "m1", name: "Pizza", price: 100 } as CartLine["menuItem"];

    await useOrderStore.getState().addToCart(menuItem, "rest-1");
    expect(useOrderStore.getState().cartCount()).toBe(1);

    await useOrderStore.getState().addToCart(menuItem, "rest-1");
    expect(useOrderStore.getState().cartCount()).toBe(2);

    await useOrderStore.getState().removeFromCart("m1", []);
    expect(useOrderStore.getState().cartCount()).toBe(1);

    unsub();

    expect(seen).toContain(1);
    expect(seen).toContain(2);
  });
});
