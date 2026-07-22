import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Order } from "@shared/types/models";

const mocks = vi.hoisted(() => ({
  getMyOrders: vi.fn(),
  getById: vi.fn(),
}));

vi.mock("@shared/services/orderService", () => ({
  orderService: { getMyOrders: mocks.getMyOrders, getById: mocks.getById },
}));

vi.mock("@shared/utils/translateApiError", () => ({
  translateApiError: (_e: unknown, fallback: string) => fallback,
}));

import { createOrdersStore } from "./createOrdersStore";
import { t } from "@shared/i18n/useTranslation";

const order = (id: string, status: string): Order => ({ id, status } as unknown as Order);

beforeEach(() => {
  mocks.getMyOrders.mockReset();
  mocks.getById.mockReset();
});

describe("createOrdersStore", () => {
  it("fetchMyOrders stores orders and total on success", async () => {
    mocks.getMyOrders.mockResolvedValue({
      data: { data: [order("1", "PENDING")], pagination: { total: 1 } },
    });
    const store = createOrdersStore();
    await store.getState().fetchMyOrders();
    const s = store.getState();
    expect(s.orders).toHaveLength(1);
    expect(s.ordersTotal).toBe(1);
    expect(s.ordersLoading).toBe(false);
    expect(s.ordersError).toBeNull();
  });

  it("fetchMyOrders sets an error message on failure", async () => {
    mocks.getMyOrders.mockRejectedValue(new Error("net"));
    const store = createOrdersStore();
    await store.getState().fetchMyOrders();
    expect(store.getState().ordersError).toBe(t("order.list.loadFailed"));
    expect(store.getState().ordersLoading).toBe(false);
  });

  it("fetchMyOrders defaults to an empty array when data is not an array", async () => {
    mocks.getMyOrders.mockResolvedValue({ data: { data: null, pagination: { total: 0 } } });
    const store = createOrdersStore();
    await store.getState().fetchMyOrders();
    expect(store.getState().orders).toEqual([]);
  });

  it("fetchOrder stores and returns the order", async () => {
    mocks.getById.mockResolvedValue({ data: { data: order("7", "READY") } });
    const store = createOrdersStore();
    const result = await store.getState().fetchOrder("7");
    expect(result.id).toBe("7");
    expect(store.getState().currentOrder?.id).toBe("7");
  });

  it("fetchOrder clears currentOrder and rethrows on failure", async () => {
    mocks.getById.mockRejectedValue(new Error("404"));
    const store = createOrdersStore();
    await expect(store.getState().fetchOrder("x")).rejects.toThrow("404");
    expect(store.getState().currentOrder).toBeNull();
  });

  it("setActiveOrder and clearActiveOrder mutate activeOrder", () => {
    const store = createOrdersStore();
    store.getState().setActiveOrder(order("3", "PENDING"));
    expect(store.getState().activeOrder?.id).toBe("3");
    store.getState().clearActiveOrder();
    expect(store.getState().activeOrder).toBeNull();
  });

  it("fetchActiveOrder picks the first non-terminal order", async () => {
    mocks.getMyOrders.mockResolvedValue({
      data: { data: [order("1", "COMPLETED"), order("2", "ACCEPTED")], pagination: { total: 2 } },
    });
    const store = createOrdersStore();
    await store.getState().fetchActiveOrder();
    expect(store.getState().activeOrder?.id).toBe("2");
  });

  it("fetchActiveOrder sets null when there is no active order", async () => {
    mocks.getMyOrders.mockResolvedValue({
      data: { data: [order("1", "COMPLETED")], pagination: { total: 1 } },
    });
    const store = createOrdersStore();
    await store.getState().fetchActiveOrder();
    expect(store.getState().activeOrder).toBeNull();
  });

  it("fetchActiveOrder records an error on failure", async () => {
    mocks.getMyOrders.mockRejectedValue(new Error("net"));
    const store = createOrdersStore();
    await store.getState().fetchActiveOrder();
    expect(store.getState().activeOrderError).toBe(t("order.status.activeLoadFailed"));
  });
});
