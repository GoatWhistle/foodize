import { create, type StoreApi, type UseBoundStore } from "zustand";
import { cartService } from "@shared/services/cartService";
import { orderService } from "@shared/services/orderService";
import { translateApiError } from "@shared/utils/translateApiError";
import { logError } from "@shared/utils/logError";
import { t } from "@shared/i18n/useTranslation";
import {
  getOptionIds,
  getLinePrice,
  getLineKey,
  normalizeCartLine,
  normalizeOrderItemForCart,
  uniqueOptions,
  buildCartItemIn,
  makeIdempotencyKey,
  type CartLine,
  type CartLineOption,
  type CartMenuItem,
} from "@shared/utils/cartLine";
import type { Order, OrderCreate } from "@shared/types/models";

export type {
  CartLine,
  CartLineOption,
  CartMenuItem,
} from "@shared/utils/cartLine";

export interface CreateCartStoreOptions {
  onRestaurantChange?: (() => Promise<boolean>) | null;
  onOrderPlaced?: ((order: Order) => void) | null;
}

export interface CartStoreState {
  cart: CartLine[];
  cartRestaurantId: string | null;
  cartError: string | null;
  orderPlacing: boolean;
  fetchCart: () => Promise<void>;
  _syncCart: () => Promise<void>;
  addToCart: (
    menuItem: CartMenuItem,
    restaurantId: string,
    selectedOptions?: CartLineOption[],
    quantity?: number,
  ) => Promise<boolean | undefined>;
  removeFromCart: (
    menuItemId: string,
    selectedOptionIds?: string[],
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  repeatOrder: (order: Order) => Promise<void>;
  cartTotal: () => number;
  cartCount: () => number;
  placeOrder: (
    promoCode?: string | null,
    comment?: string,
    requestedPickupAt?: string | null,
  ) => Promise<Order | undefined>;
}

export function createCartStore({
  onRestaurantChange = null,
  onOrderPlaced = null,
}: CreateCartStoreOptions = {}): UseBoundStore<StoreApi<CartStoreState>> {
  let syncQueue: Promise<void> = Promise.resolve();

  return create<CartStoreState>((set, get) => ({
    cart: [],
    cartRestaurantId: null,
    cartError: null,
    orderPlacing: false,

    fetchCart: async () => {
      try {
        const response = await cartService.getCart();
        set({
          cart: response.data.data.items.map(normalizeCartLine),
          cartRestaurantId: response.data.data.restaurant_id ?? null,
          cartError: null,
        });
      } catch (err) {
        set({ cartError: translateApiError(err, t("order.cart.loadFailed")) });
      }
    },

    _syncCart: () => {
      const run = (async () => {
        try {
          await syncQueue;
        } catch (err) {
          logError("useCartStore._syncCart.previous", err);
        }
        const { cart, cartRestaurantId } = get();
        if (!cartRestaurantId) return;
        try {
          await cartService.updateCart({
            restaurant_id: cartRestaurantId,
            items: cart.map(buildCartItemIn),
          });
          set({ cartError: null });
        } catch (err) {
          set({
            cartError: translateApiError(err, t("order.cart.syncFailed")),
          });
          throw err;
        }
      })();
      syncQueue = run.catch(() => {});
      return run.catch(() => {});
    },

    addToCart: async (menuItem, restaurantId, selectedOptions = [], quantity = 1) => {
      const { cart, cartRestaurantId } = get();
      const normalizedOptions = uniqueOptions(selectedOptions);
      const safeQuantity = Math.max(1, quantity || 1);
      const selectedOptionIds = normalizedOptions
        .map((o) => o.id ?? o.option_id)
        .filter((id): id is string => Boolean(id));
      const lineKey = getLineKey(menuItem.id, selectedOptionIds);
      const nextItem: CartLine = {
        menuItem,
        quantity: safeQuantity,
        selectedOptionIds,
        selectedOptions: normalizedOptions.map((o) => {
          const optionId = o.id ?? o.option_id;
          return {
            ...(optionId !== undefined ? { option_id: optionId, id: optionId } : {}),
            ...(o.name !== undefined ? { name: o.name } : {}),
            ...(o.price_delta !== undefined ? { price_delta: o.price_delta } : {}),
          };
        }),
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
        const response = await orderService.create(payload, {
          headers: { "Idempotency-Key": makeIdempotencyKey() },
        });
        set({ cart: [], cartRestaurantId: null, orderPlacing: false });
        onOrderPlaced?.(response.data.data);
        await cartService.clearCart();
        return response.data.data;
      } catch (err) {
        set({ orderPlacing: false });
        throw err;
      }
    },
  }));
}
