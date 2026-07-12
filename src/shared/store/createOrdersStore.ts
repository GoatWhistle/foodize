import { create, type StoreApi, type UseBoundStore } from "zustand";
import { orderService } from "@shared/services/orderService";
import { translateApiError } from "@shared/utils/translateApiError";
import type { Order } from "@shared/types/models";

export interface OrdersStoreState {
  orders: Order[];
  currentOrder: Order | null;
  ordersLoading: boolean;
  ordersError: string | null;
  ordersTotal: number;
  activeOrder: Order | null;
  activeOrderError: string | null;
  fetchMyOrders: (params?: Record<string, unknown>) => Promise<void>;
  fetchOrder: (id: string) => Promise<Order>;
  setActiveOrder: (order: Order | null) => void;
  clearActiveOrder: () => void;
  fetchActiveOrder: () => Promise<void>;
}

export function createOrdersStore(): UseBoundStore<StoreApi<OrdersStoreState>> {
  return create<OrdersStoreState>((set) => ({
    orders: [],
    currentOrder: null,
    ordersLoading: false,
    ordersError: null,
    ordersTotal: 0,
    activeOrder: null,
    activeOrderError: null,

    fetchMyOrders: async (params = {}) => {
      set({ ordersLoading: true, ordersError: null });
      try {
        const res = await orderService.getMyOrders(params);
        const orders = Array.isArray(res.data.data) ? res.data.data : [];
        set({
          orders,
          ordersTotal: res.data.pagination.total,
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

    setActiveOrder: (order) => { set({ activeOrder: order }); },
    clearActiveOrder: () => { set({ activeOrder: null }); },

    fetchActiveOrder: async () => {
      try {
        const res = await orderService.getMyOrders({ page: 1, size: 5 });
        const orders = Array.isArray(res.data.data) ? res.data.data : [];
        const active = orders.find((o) =>
          ["PENDING", "ACCEPTED", "READY"].includes(o.status),
        );
        set({ activeOrder: active ?? null, activeOrderError: null });
      } catch (err) {
        set({ activeOrderError: translateApiError(err, "Не удалось загрузить активный заказ") });
      }
    },
  }));
}
