import { create } from "zustand";
import { orderService } from "../services/orderService";
import { cartService } from "../services/cartService";

export const useOrderStore = create((set, get) => ({
  cart: [],
  cartRestaurantId: null,

  fetchCart: async () => {
    try {
      const res = await cartService.getCart();
      set({
        cart: res.data.data.items ?? [],
        cartRestaurantId: res.data.data.restaurant_id ?? null,
      });
    } catch (err) {
      console.error(err);
    }
  },

  _syncCart: async () => {
    const { cart, cartRestaurantId } = get();
    if (!cartRestaurantId) return;

    const payload = {
      restaurant_id: cartRestaurantId,
      items: cart.map((i) => ({
        menu_item_id: i.menuItem.id,
        name: i.menuItem.name,
        price: i.menuItem.price,
        image_url: i.menuItem.image_url ?? null,
        quantity: i.quantity,
      })),
    };
    await cartService.updateCart(payload);
  },

  addToCart: async (menuItem, restaurantId) => {
    const { cart, cartRestaurantId } = get();

    if (cartRestaurantId && cartRestaurantId !== restaurantId) {
      set({
        cart: [{ menuItem, quantity: 1 }],
        cartRestaurantId: restaurantId,
      });
    } else {
      const existing = cart.find((i) => i.menuItem.id === menuItem.id);
      if (existing) {
        set({
          cart: cart.map((i) =>
            i.menuItem.id === menuItem.id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        });
      } else {
        set({
          cart: [...cart, { menuItem, quantity: 1 }],
          cartRestaurantId: restaurantId,
        });
      }
    }
    await get()._syncCart();
  },

  removeFromCart: async (menuItemId) => {
    set((s) => {
      const updated = s.cart
        .map((i) =>
          i.menuItem.id === menuItemId ? { ...i, quantity: i.quantity - 1 } : i,
        )
        .filter((i) => i.quantity > 0);
      return {
        cart: updated,
        cartRestaurantId: updated.length ? s.cartRestaurantId : null,
      };
    });
    const { cart } = get();
    if (cart.length === 0) {
      await cartService.clearCart();
    } else {
      await get()._syncCart();
    }
  },

  clearCart: async () => {
    set({ cart: [], cartRestaurantId: null });
    await cartService.clearCart();
  },

  cartTotal: () =>
    get().cart.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0),

  cartCount: () => get().cart.reduce((sum, i) => sum + i.quantity, 0),

  orders: [],
  currentOrder: null,
  ordersLoading: false,

  placeOrder: async (promoCode = null) => {
    const { cart, cartRestaurantId } = get();
    const payload = {
      restaurant_id: cartRestaurantId,
      items: cart.map((i) => ({
        menu_item_id: i.menuItem.id,
        quantity: i.quantity,
      })),
      ...(promoCode ? { promo_code: promoCode } : {}),
    };
    const res = await orderService.create(payload);
    set((s) => ({
      orders: [res.data.data, ...s.orders],
      currentOrder: res.data.data,
      cart: [],
      cartRestaurantId: null,
    }));
    await cartService.clearCart();
    return res.data.data;
  },

  ordersTotal: 0,

  fetchMyOrders: async (params = {}) => {
    set({ ordersLoading: true });
    try {
      const res = await orderService.getMyOrders({ params });
      const orders = Array.isArray(res.data?.data) ? res.data.data : [];
      const ordersTotal = res.data?.pagination?.total || orders.length;

      set({ orders, ordersTotal, ordersLoading: false });
    } catch {
      set({ ordersLoading: false });
    }
  },

  fetchOrder: async (id) => {
    const res = await orderService.getById(id);
    set({ currentOrder: res.data.data });
    return res.data.data;
  },
}));
