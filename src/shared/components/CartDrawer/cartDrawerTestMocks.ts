import { vi } from "vitest";
import type { CartLine } from "@shared/utils/cartLine";
import type { LoyaltyStatus, OrderLoadEstimate } from "@shared/types/models";

const cartState = {
  cart: [] as CartLine[],
  cartRestaurantId: "rest-1" as string | null,
  removeFromCart: vi.fn(() => Promise.resolve()),
  addToCart: vi.fn(() => Promise.resolve(true)),
  clearCart: vi.fn(() => Promise.resolve()),
  placeOrder: vi.fn(() => Promise.resolve({ display_id: 5 })),
  cartTotal: () => 300,
};
const useCartStore = Object.assign(
  vi.fn((selector?: (s: typeof cartState) => unknown) =>
    selector ? selector(cartState) : cartState,
  ),
  { getState: () => cartState },
);
const ordersState = { orders: [] as unknown[] };
const useOrdersStore = Object.assign(
  vi.fn((selector?: (s: typeof ordersState) => unknown) =>
    selector ? selector(ordersState) : ordersState,
  ),
  { getState: () => ordersState },
);
const validate = vi.fn((..._a: unknown[]): Promise<unknown> =>
  Promise.resolve(),
);
const getEstimate = vi.fn((..._a: unknown[]) =>
  Promise.resolve({ data: { data: null as OrderLoadEstimate | null } }),
);
const authState = { user: null as { permissions: string[] } | null };
const useAuthStore = Object.assign(
  vi.fn((selector?: (s: typeof authState) => unknown) =>
    selector ? selector(authState) : authState,
  ),
  { getState: () => authState },
);
const getStatus = vi.fn((..._a: unknown[]): Promise<unknown> =>
  Promise.resolve({ data: { data: null } }),
);

export const mocks = {
  cartState,
  useCartStore,
  ordersState,
  useOrdersStore,
  validate,
  getEstimate,
  authState,
  useAuthStore,
  getStatus,
};

export const line = (over: Partial<CartLine> = {}): CartLine =>
  ({
    menuItem: { id: "m1", name: "Пицца", price: 300 },
    quantity: 1,
    selectedOptionIds: [],
    selectedOptions: [],
    lineKey: "m1:",
    ...over,
  });

export const resetCartDrawerMocks = (): void => {
  vi.clearAllMocks();
  mocks.cartState.cart = [line()];
  mocks.cartState.cartRestaurantId = "rest-1";
  mocks.ordersState.orders = [];
  mocks.authState.user = null;
  mocks.getEstimate.mockResolvedValue({ data: { data: null } });
  mocks.getStatus.mockResolvedValue({ data: { data: null } });
};

export const loyaltyStatus = (over: Partial<LoyaltyStatus> = {}): LoyaltyStatus => ({
  program: {
    id: "lp1",
    restaurant_id: "rest-1",
    type: "CASHBACK",
    is_active: true,
    tier_basis: "ORDERS",
    min_order_amount: null,
    punches_required: null,
    reward_type: null,
    reward_value: null,
    reward_menu_item_id: null,
    max_redeem_percent: 50,
    tiers: [],
  },
  points_balance: 1000,
  punches_count: 0,
  orders_count: 2,
  total_spent: 600,
  current_tier: { id: "t1", name: "База", threshold: 0, cashback_percent: 5 },
  next_tier: null,
  rewards: [],
  ...over,
});

export const punchStatus = (over: Partial<LoyaltyStatus> = {}): LoyaltyStatus =>
  loyaltyStatus({
    program: {
      ...(loyaltyStatus().program as NonNullable<LoyaltyStatus["program"]>),
      type: "PUNCH_CARD",
      punches_required: 5,
      reward_type: "FREE_ITEM",
      reward_menu_item_id: "m1",
    },
    points_balance: 0,
    current_tier: null,
    ...over,
  });
