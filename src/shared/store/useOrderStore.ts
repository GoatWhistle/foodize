import { create, type StoreApi, type UseBoundStore } from "zustand";
import { cartService } from "@shared/services/cartService";
import { orderService } from "@shared/services/orderService";
import { translateApiError } from "@shared/utils/translateApiError";
import type {
  MenuItem,
  MenuItemShort,
  Order,
  OrderItem,
  OrderCreate,
  CartItemIn,
  CartSelectedOption,
} from "@shared/types/models";

export interface CartLineOption {
  id?: string;
  option_id?: string;
  name?: string;
  price_delta?: number | null;
}

export type CartMenuItem = (MenuItem | MenuItemShort) & {
  image_url?: string | null;
};

export interface CartLine {
  menuItem: CartMenuItem;
  quantity: number;
  selectedOptionIds?: string[];
  selectedOptions?: CartLineOption[];
  selected_options?: CartLineOption[];
  selected_option_ids?: string[];
  lineKey?: string;
}

export interface CreateOrderStoreOptions {
  onRestaurantChange?: (() => Promise<boolean>) | null;
}

export interface OrderStoreState {
  cart: CartLine[];
  cartRestaurantId: string | null;
  orders: Order[];
  currentOrder: Order | null;
  ordersLoading: boolean;
  ordersError: string | null;
  ordersTotal: number;
  activeOrder: Order | null;
  cartError: string | null;
  activeOrderError: string | null;
  orderPlacing: boolean;
  fetchCart: () => Promise<void>;
  _syncCart: () => Promise<void>;
  addToCart: (
    menuItem: CartMenuItem,
    restaurantId: string,
    selectedOptions?: CartLineOption[],
    quantity?: number,
  ) => Promise<boolean | void>;
  removeFromCart: (
    menuItemId: string,
    selectedOptionIds?: string[],
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  repeatOrder: (order: Order) => Promise<void>;
  cartTotal: () => number;
  cartCount: () => number;
  setActiveOrder: (order: Order | null) => void;
  clearActiveOrder: () => void;
  fetchActiveOrder: () => Promise<void>;
  placeOrder: (
    promoCode?: string | null,
    comment?: string,
    requestedPickupAt?: string | null,
  ) => Promise<Order | undefined>;
  fetchMyOrders: (params?: Record<string, unknown>) => Promise<void>;
  fetchOrder: (id: string) => Promise<Order>;
}

const getOptionIds = (item: CartLine): string[] =>
  [
    ...new Set(
      item.selectedOptionIds ??
        item.selected_option_ids ??
        getSelectedOptions(item).map((o) => o.id ?? o.option_id),
    ),
  ].filter((id): id is string => Boolean(id));

const getSelectedOptions = (item: CartLine): CartLineOption[] =>
  item.selectedOptions ?? item.selected_options ?? [];

const getOptionsTotal = (item: CartLine): number =>
  getSelectedOptions(item).reduce(
    (sum, o) => sum + (Number(o.price_delta) || 0),
    0,
  );

const getLinePrice = (item: CartLine): number =>
  (Number(item.menuItem.price) || 0) + getOptionsTotal(item);

const getLineKey = (
  menuItemId: string,
  selectedOptionIds: string[] = [],
): string => `${menuItemId}:${[...selectedOptionIds].sort().join(",")}`;

const normalizeOrderItemForCart = (i: OrderItem): CartItemIn => {
  const options = i.selected_options ?? [];
  const optionIds = options
    .map((o) => o.option_id)
    .filter((id): id is string => Boolean(id));
  const optionsTotal = options.reduce(
    (sum, o) => sum + (Number(o.price_delta) || 0),
    0,
  );
  const basePrice = Math.max(0, (Number(i.price_at_purchase) || 0) - optionsTotal);
  return {
    menu_item_id: i.menu_item_id,
    name: i.menu_item_name,
    price: basePrice,
    image_url: null,
    quantity: i.quantity,
    selected_option_ids: optionIds,
    selected_options: options.map((o) => ({
      option_id: o.option_id ?? "",
      name: o.name,
      price_delta: Number(o.price_delta) || 0,
    })),
  };
};

const uniqueOptions = (options: CartLineOption[] = []): CartLineOption[] => {
  const seen = new Set<string>();
  return options.filter((o) => {
    const id = o.id ?? o.option_id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const toCartSelectedOptions = (
  options: CartLineOption[],
): CartSelectedOption[] =>
  options.map((o) => ({
    option_id: o.option_id ?? o.id ?? "",
    name: o.name ?? "",
    price_delta: Number(o.price_delta) || 0,
  }));

const buildCartItemIn = (i: CartLine): CartItemIn => ({
  menu_item_id: i.menuItem.id,
  name: i.menuItem.name,
  price: i.menuItem.price,
  image_url: i.menuItem.image_url ?? null,
  quantity: i.quantity,
  selected_option_ids: getOptionIds(i),
  selected_options: toCartSelectedOptions(uniqueOptions(getSelectedOptions(i))),
});

const makeIdempotencyKey = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function createOrderStore({
  onRestaurantChange = null,
}: CreateOrderStoreOptions = {}): UseBoundStore<StoreApi<OrderStoreState>> {
  let syncChain: Promise<void> = Promise.resolve();

  return create<OrderStoreState>((set, get) => ({
    cart: [],
    cartRestaurantId: null,
    orders: [],
    currentOrder: null,
    ordersLoading: false,
    ordersError: null,
    ordersTotal: 0,
    activeOrder: null,
    cartError: null,
    activeOrderError: null,
    orderPlacing: false,

    fetchCart: async () => {
      try {
        const res = await cartService.getCart();
        set({
          cart: res.data.data.items ?? [],
          cartRestaurantId: res.data.data.restaurant_id ?? null,
          cartError: null,
        });
      } catch (err) {
        set({ cartError: translateApiError(err, "Не удалось загрузить корзину") });
      }
    },

    _syncCart: () => {
      syncChain = syncChain.then(async () => {
        const { cart, cartRestaurantId } = get();
        if (!cartRestaurantId) return;
        await cartService.updateCart({
          restaurant_id: cartRestaurantId,
          items: cart.map(buildCartItemIn),
        });
      });
      return syncChain;
    },

    addToCart: async (menuItem, restaurantId, selectedOptions = [], quantity = 1) => {
      const { cart, cartRestaurantId } = get();
      const normalizedOptions = uniqueOptions(selectedOptions);
      const safeQuantity = Math.max(1, Number(quantity) || 1);
      const selectedOptionIds = normalizedOptions
        .map((o) => o.id ?? o.option_id)
        .filter((id): id is string => Boolean(id));
      const lineKey = getLineKey(menuItem.id, selectedOptionIds);
      const nextItem: CartLine = {
        menuItem,
        quantity: safeQuantity,
        selectedOptionIds,
        selectedOptions: normalizedOptions.map((o) => ({
          option_id: o.id ?? o.option_id,
          id: o.id ?? o.option_id,
          name: o.name,
          price_delta: o.price_delta,
        })),
        lineKey,
      };

      if (cartRestaurantId && cartRestaurantId !== restaurantId && cart.length > 0) {
        const confirmed = onRestaurantChange ? await onRestaurantChange() : false;
        if (!confirmed) return false;
        set({ cart: [nextItem], cartRestaurantId: restaurantId });
      } else {
        const existing = cart.find(
          (i) => getLineKey(i.menuItem.id, getOptionIds(i)) === lineKey,
        );
        if (existing) {
          set({
            cart: cart.map((i) =>
              getLineKey(i.menuItem.id, getOptionIds(i)) === lineKey
                ? { ...i, quantity: i.quantity + safeQuantity }
                : i,
            ),
          });
        } else {
          set({ cart: [...cart, nextItem], cartRestaurantId: restaurantId });
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

    repeatOrder: async (order) => {
      const payload = {
        restaurant_id: order.restaurant_id,
        items: order.items.map(normalizeOrderItemForCart),
      };
      await cartService.updateCart(payload);
      await get().fetchCart();
    },

    cartTotal: () =>
      get().cart.reduce((sum, i) => sum + getLinePrice(i) * i.quantity, 0),
    cartCount: () => get().cart.reduce((sum, i) => sum + i.quantity, 0),

    setActiveOrder: (order) => set({ activeOrder: order }),
    clearActiveOrder: () => set({ activeOrder: null }),

    fetchActiveOrder: async () => {
      try {
        const res = await orderService.getMyOrders({ page: 1, size: 5 });
        const orders = Array.isArray(res.data?.data) ? res.data.data : [];
        const active = orders.find((o) =>
          ["PENDING", "ACCEPTED", "READY"].includes(o.status),
        );
        set({ activeOrder: active ?? null, activeOrderError: null });
      } catch (err) {
        set({ activeOrderError: translateApiError(err, "Не удалось загрузить активный заказ") });
      }
    },

    placeOrder: async (promoCode = null, comment = "", requestedPickupAt = null) => {
      if (get().orderPlacing) return;
      set({ orderPlacing: true });
      try {
        const { cart, cartRestaurantId } = get();
        if (!cartRestaurantId) {
          set({ orderPlacing: false });
          return;
        }
        const trimmedComment = comment.trim();
        const payload: OrderCreate = {
          restaurant_id: cartRestaurantId,
          items: cart.map((i) => ({
            menu_item_id: i.menuItem.id,
            quantity: i.quantity,
            selected_option_ids: getOptionIds(i),
          })),
          ...(promoCode ? { promo_code: promoCode } : {}),
          ...(trimmedComment ? { comment: trimmedComment } : {}),
          ...(requestedPickupAt ? { requested_pickup_at: requestedPickupAt } : {}),
        };
        const res = await orderService.create(payload, {
          headers: { "Idempotency-Key": makeIdempotencyKey() },
        });
        set((s) => ({
          orders: [res.data.data, ...s.orders],
          currentOrder: res.data.data,
          activeOrder: res.data.data,
          cart: [],
          cartRestaurantId: null,
          orderPlacing: false,
        }));
        await cartService.clearCart();
        return res.data.data;
      } catch (err) {
        set({ orderPlacing: false });
        throw err;
      }
    },

    fetchMyOrders: async (params = {}) => {
      set({ ordersLoading: true, ordersError: null });
      try {
        const res = await orderService.getMyOrders(params);
        const orders = Array.isArray(res.data?.data) ? res.data.data : [];
        set({
          orders,
          ordersTotal: res.data?.pagination?.total ?? orders.length,
          ordersLoading: false,
        });
      } catch (err) {
        set({
          ordersLoading: false,
          ordersError: translateApiError(err, "Не удалось загрузить заказы"),
        });
      }
    },

    fetchOrder: async (id) => {
      try {
        const res = await orderService.getById(id);
        set({ currentOrder: res.data.data });
        return res.data.data;
      } catch (err) {
        set({ currentOrder: null });
        throw err;
      }
    },
  }));
}
