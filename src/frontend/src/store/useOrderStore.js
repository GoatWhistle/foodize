import { create } from "zustand";
import { orderService } from "../services/orderService";

export const useOrderStore = create((set, get) => ({
  cart: [],
  cartRestaurantId: null,

  addToCart: (menuItem, restaurantId) => {
    const { cart, cartRestaurantId } = get();
    // Clear cart if switching restaurant
    if (cartRestaurantId && cartRestaurantId !== restaurantId) {
      set({
        cart: [{ menuItem, quantity: 1 }],
        cartRestaurantId: restaurantId,
      });
      return;
    }
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
  },

  removeFromCart: (menuItemId) =>
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
    }),

  clearCart: () => set({ cart: [], cartRestaurantId: null }),

  cartTotal: () =>
    get().cart.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0),

  cartCount: () => get().cart.reduce((sum, i) => sum + i.quantity, 0),

  orders: [],
  currentOrder: null,
  ordersLoading: false,

  placeOrder: async () => {
    const { cart, cartRestaurantId } = get();
    const payload = {
      restaurant_id: cartRestaurantId,
      items: cart.map((i) => ({
        menu_item_id: i.menuItem.id,
        quantity: i.quantity,
      })),
    };
    const res = await orderService.create(payload);
    set((s) => ({
      orders: [res.data, ...s.orders],
      currentOrder: res.data,
      cart: [],
      cartRestaurantId: null,
    }));
    return res.data;
  },

  fetchMyOrders: async () => {
    set({ ordersLoading: true });
    try {
      const res = await orderService.getMyOrders();
      set({ orders: res.data.data, ordersLoading: false });
    } catch {
      set({ ordersLoading: false });
    }
  },

  fetchOrder: async (id) => {
    const res = await orderService.getById(id);
    set({ currentOrder: res.data });
    return res.data;
  },
}));
