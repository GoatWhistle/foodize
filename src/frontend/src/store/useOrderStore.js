import { create } from "zustand";
import { orderService } from "../services/orderService";
import { cartService } from "../services/cartService";

const getOptionIds = (item) =>
  item.selectedOptionIds ??
  item.selected_option_ids ??
  getSelectedOptions(item).map((option) => option.id ?? option.option_id);

const getSelectedOptions = (item) =>
  item.selectedOptions ?? item.selected_options ?? [];

const getOptionsTotal = (item) =>
  getSelectedOptions(item).reduce(
    (sum, option) => sum + (Number(option.price_delta) || 0),
    0,
  );

const getLinePrice = (item) =>
  (Number(item.menuItem.price) || 0) + getOptionsTotal(item);

const getLineKey = (menuItemId, selectedOptionIds = []) =>
  `${menuItemId}:${[...selectedOptionIds].sort().join(",")}`;

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
        selected_option_ids: getOptionIds(i),
        selected_options: getSelectedOptions(i),
      })),
    };
    await cartService.updateCart(payload);
  },

  addToCart: async (menuItem, restaurantId, selectedOptions = []) => {
    const { cart, cartRestaurantId } = get();
    const selectedOptionIds = selectedOptions.map(
      (option) => option.id ?? option.option_id,
    );
    const lineKey = getLineKey(menuItem.id, selectedOptionIds);
    const nextItem = {
      menuItem,
      quantity: 1,
      selectedOptionIds,
      selectedOptions: selectedOptions.map((option) => ({
        option_id: option.id ?? option.option_id,
        id: option.id ?? option.option_id,
        name: option.name,
        price_delta: option.price_delta,
      })),
      lineKey,
    };

    if (cartRestaurantId && cartRestaurantId !== restaurantId) {
      set({
        cart: [nextItem],
        cartRestaurantId: restaurantId,
      });
    } else {
      const existing = cart.find(
        (i) => getLineKey(i.menuItem.id, getOptionIds(i)) === lineKey,
      );
      if (existing) {
        set({
          cart: cart.map((i) =>
            getLineKey(i.menuItem.id, getOptionIds(i)) === lineKey
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        });
      } else {
        set({
          cart: [...cart, nextItem],
          cartRestaurantId: restaurantId,
        });
      }
    }
    await get()._syncCart();
  },

  removeFromCart: async (menuItemId, selectedOptionIds = []) => {
    const lineKey = getLineKey(menuItemId, selectedOptionIds);
    set((s) => {
      const updated = s.cart
        .map((i) =>
          getLineKey(i.menuItem.id, getOptionIds(i)) === lineKey
            ? { ...i, quantity: i.quantity - 1 }
            : i,
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
    get().cart.reduce((sum, i) => sum + getLinePrice(i) * i.quantity, 0),

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
        selected_option_ids: getOptionIds(i),
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
