import { renderHook, act, waitFor, render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useOrdersPageLogic as useOrdersPageLogicForScroll } from "@shared/hooks/useOrdersPageLogic";

const fetchMyOrders = vi.fn();

let storeState: {
  orders: Array<Record<string, unknown>>;
  ordersTotal: number;
  fetchMyOrders: typeof fetchMyOrders;
  ordersLoading: boolean;
  ordersError: string | null;
};

vi.mock("zustand/react/shallow", () => ({
  useShallow: (fn: unknown) => fn,
}));

vi.mock("@shared/store/useOrdersStore.instance", () => ({
  useOrdersStore: vi.fn((sel?: (s: unknown) => unknown) =>
    sel ? sel(storeState) : storeState,
  ),
}));

import { useOrdersPageLogic } from "@shared/hooks/useOrdersPageLogic";

const ACTIVE = { id: "a", display_id: 1, status: "PENDING" };
const DONE = { id: "b", display_id: 2, status: "COMPLETED" };
const CANCELLED = { id: "c", display_id: 3, status: "CANCELLED" };

describe("useOrdersPageLogic", () => {
  beforeEach(() => {
    fetchMyOrders.mockReset();
    fetchMyOrders.mockResolvedValue(undefined);
    storeState = {
      orders: [ACTIVE, DONE, CANCELLED],
      ordersTotal: 3,
      fetchMyOrders,
      ordersLoading: false,
      ordersError: null,
    };
  });

  it("fetches orders on mount and exposes them", async () => {
    const { result } = renderHook(() => useOrdersPageLogic({ pageSize: 20 }));
    await waitFor(() => { expect(fetchMyOrders).toHaveBeenCalled(); });
    expect(result.current.allOrders).toHaveLength(3);
    expect(result.current.ordersTotal).toBe(3);
    expect(result.current.totalPages).toBe(1);
  });

  it("passes COMPLETED status when filter is DONE", async () => {
    const { result } = renderHook(() => useOrdersPageLogic({ pageSize: 20 }));
    await waitFor(() => { expect(fetchMyOrders).toHaveBeenCalled(); });
    fetchMyOrders.mockClear();
    act(() => {
      result.current.setStatusFilter("DONE");
    });
    await waitFor(() =>
      { expect(fetchMyOrders).toHaveBeenCalledWith(
        expect.objectContaining({ status: "COMPLETED" }),
      ); },
    );
  });

  it("derives visibleOrders for the ACTIVE filter", async () => {
    const { result, rerender } = renderHook(
      (_: { tick: number }) => useOrdersPageLogic({ pageSize: 20 }),
      { initialProps: { tick: 0 } },
    );
    await waitFor(() => { expect(result.current.allOrders).toHaveLength(3); });
    act(() => {
      result.current.setStatusFilter("ACTIVE");
    });
    storeState.orders = [ACTIVE, DONE, CANCELLED];
    rerender({ tick: 1 });
    await waitFor(() =>
      { expect(result.current.visibleOrders.map((o) => o.id)).toEqual(["a"]); },
    );
  });

  it("returns all orders as visible when no filter", async () => {
    const { result } = renderHook(() => useOrdersPageLogic({ pageSize: 20 }));
    await waitFor(() => { expect(result.current.allOrders).toHaveLength(3); });
    expect(result.current.visibleOrders).toHaveLength(3);
  });

  it("computes hasMore and totalPages from total", async () => {
    storeState.ordersTotal = 45;
    const { result } = renderHook(() => useOrdersPageLogic({ pageSize: 20 }));
    await waitFor(() => { expect(fetchMyOrders).toHaveBeenCalled(); });
    expect(result.current.totalPages).toBe(3);
    expect(result.current.hasMore).toBe(true);
  });

  it("passes through loading and error state", async () => {
    storeState.ordersLoading = true;
    storeState.ordersError = "fail";
    const { result } = renderHook(() => useOrdersPageLogic({ pageSize: 20 }));
    await waitFor(() => { expect(fetchMyOrders).toHaveBeenCalled(); });
    expect(result.current.ordersLoading).toBe(true);
    expect(result.current.ordersError).toBe("fail");
  });

  it("refresh resets to page 1 and refetches", async () => {
    const { result } = renderHook(() => useOrdersPageLogic({ pageSize: 20 }));
    await waitFor(() => { expect(fetchMyOrders).toHaveBeenCalled(); });
    act(() => {
      result.current.setPage(2);
    });
    fetchMyOrders.mockClear();
    act(() => {
      result.current.refresh();
    });
    await waitFor(() => { expect(fetchMyOrders).toHaveBeenCalled(); });
    expect(result.current.page).toBe(1);
  });

  it("logs but does not throw when fetch fails", async () => {
    fetchMyOrders.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useOrdersPageLogic({ pageSize: 20 }));
    await waitFor(() => { expect(fetchMyOrders).toHaveBeenCalled(); });
    expect(result.current.allOrders).toHaveLength(3);
  });

  it("loads the next page when the sentinel intersects in infinite-scroll mode", async () => {
    let trigger: (() => void) | null = null;
    class IO {
      cb: (entries: unknown[]) => void;
      constructor(cb: (entries: unknown[]) => void) {
        this.cb = cb;
      }
      observe() {
        trigger = () => { this.cb([{ isIntersecting: true }]); };
      }
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", IO);
    storeState.ordersTotal = 40;
    const seen: number[] = [];
    const Probe = () => {
      const { sentinelRef, page } = useOrdersPageLogicForScroll({
        pageSize: 20,
        infiniteScroll: true,
      });
      seen.push(page);
      return <div ref={sentinelRef} />;
    };
    render(<Probe />);
    await waitFor(() => { expect(trigger).not.toBeNull(); });
    act(() => {
      trigger?.();
    });
    await waitFor(() => { expect(seen).toContain(2); });
    vi.unstubAllGlobals();
  });
});
