import { renderHook, act, waitFor, render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const fetchPublicRestaurants = vi.fn();

let storeState: {
  publicRestaurants: Array<Record<string, unknown>>;
  publicLoading: boolean;
  publicRestaurantsTotal: number;
  fetchPublicRestaurants: typeof fetchPublicRestaurants;
};

vi.mock("zustand/react/shallow", () => ({
  useShallow: (fn: unknown) => fn,
}));

vi.mock("@shared/store/useRestaurantStore", () => ({
  useRestaurantStore: vi.fn((sel?: (s: unknown) => unknown) =>
    sel ? sel(storeState) : storeState,
  ),
}));

import { useHomePageLogic } from "@shared/hooks/useHomePageLogic";

const R1 = { id: "r1", name: "Alpha" };
const R2 = { id: "r2", name: "Beta" };

describe("useHomePageLogic", () => {
  beforeEach(() => {
    fetchPublicRestaurants.mockReset();
    fetchPublicRestaurants.mockResolvedValue(undefined);
    storeState = {
      publicRestaurants: [R1, R2],
      publicLoading: false,
      publicRestaurantsTotal: 2,
      fetchPublicRestaurants,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches on mount with defaults and exposes the list", async () => {
    const { result } = renderHook(() => useHomePageLogic({ pageSize: 20 }));
    await waitFor(() => { expect(fetchPublicRestaurants).toHaveBeenCalled(); });
    expect(result.current.allRestaurants).toHaveLength(2);
    expect(result.current.publicRestaurantsTotal).toBe(2);
    expect(fetchPublicRestaurants).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, size: 20, sort: "default", direction: "desc" }),
    );
  });

  it("debounces the search before refetching", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useHomePageLogic({ pageSize: 20 }));
    await vi.waitFor(() => { expect(fetchPublicRestaurants).toHaveBeenCalled(); });
    fetchPublicRestaurants.mockClear();

    act(() => {
      result.current.setSearch("pizza");
    });
    expect(result.current.searching).toBe(true);
    expect(fetchPublicRestaurants).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(result.current.debouncedSearch).toBe("pizza");
    expect(result.current.searching).toBe(false);
    expect(fetchPublicRestaurants).toHaveBeenCalledWith(
      expect.objectContaining({ name: "pizza" }),
    );
  });

  it("sends is_open when onlyOpen is enabled", async () => {
    const { result } = renderHook(() => useHomePageLogic({ pageSize: 20 }));
    await waitFor(() => { expect(fetchPublicRestaurants).toHaveBeenCalled(); });
    fetchPublicRestaurants.mockClear();
    act(() => {
      result.current.setOnlyOpen(true);
    });
    await waitFor(() =>
      { expect(fetchPublicRestaurants).toHaveBeenCalledWith(
        expect.objectContaining({ is_open: true }),
      ); },
    );
  });

  it("resetFilters clears search and onlyOpen", async () => {
    const { result } = renderHook(() => useHomePageLogic({ pageSize: 20 }));
    await waitFor(() => { expect(fetchPublicRestaurants).toHaveBeenCalled(); });
    act(() => {
      result.current.setSearch("x");
      result.current.setOnlyOpen(true);
    });
    act(() => {
      result.current.resetFilters();
    });
    expect(result.current.search).toBe("");
    expect(result.current.onlyOpen).toBe(false);
  });

  it("passes through the loading flag", async () => {
    storeState.publicLoading = true;
    const { result } = renderHook(() => useHomePageLogic({ pageSize: 20 }));
    await waitFor(() => { expect(fetchPublicRestaurants).toHaveBeenCalled(); });
    expect(result.current.loading).toBe(true);
  });

  it("swallows fetch errors", async () => {
    fetchPublicRestaurants.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useHomePageLogic({ pageSize: 20 }));
    await waitFor(() => { expect(fetchPublicRestaurants).toHaveBeenCalled(); });
    expect(result.current.allRestaurants).toHaveLength(2);
  });

  it("resets page to 1 when the sort changes", async () => {
    const { result } = renderHook(() => useHomePageLogic({ pageSize: 20 }));
    await waitFor(() => { expect(fetchPublicRestaurants).toHaveBeenCalled(); });
    act(() => {
      result.current.setPage(3);
    });
    act(() => {
      result.current.setSort("rating");
    });
    await waitFor(() => { expect(result.current.page).toBe(1); });
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
    storeState.publicRestaurantsTotal = 40;
    const seen: number[] = [];
    const Probe = () => {
      const { sentinelRef, page } = useHomePageLogic({
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
