import { renderHook, act, render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useInfiniteList } from "@shared/hooks/useInfiniteList";

interface Item {
  id: string;
}

const getId = (i: Item): string => i.id;

const PAGE1 = [{ id: "a" }, { id: "b" }];
const PAGE2 = [{ id: "b" }, { id: "c" }];

describe("useInfiniteList", () => {
  it("replaces the accumulated list on page 1", () => {
    const { result } = renderHook(() =>
      useInfiniteList<Item>({
        items: PAGE1,
        total: 10,
        page: 1,
        pageSize: 2,
        resetKey: "k",
        loading: false,
        infiniteScroll: false,
        getId,
        onLoadMore: vi.fn(),
      }),
    );
    expect(result.current.accumulated.map(getId)).toEqual(["a", "b"]);
    expect(result.current.hasMore).toBe(true);
  });

  it("appends deduplicated items on later pages", () => {
    const { result, rerender } = renderHook(
      ({ items, page }: { items: Item[]; page: number }) =>
        useInfiniteList<Item>({
          items,
          total: 10,
          page,
          pageSize: 2,
          resetKey: "k",
          loading: false,
          infiniteScroll: false,
          getId,
          onLoadMore: vi.fn(),
        }),
      { initialProps: { items: PAGE1, page: 1 } },
    );
    rerender({ items: PAGE2, page: 2 });
    expect(result.current.accumulated.map(getId)).toEqual(["a", "b", "c"]);
  });

  it("resets accumulated when resetKey changes", () => {
    const { result, rerender } = renderHook(
      ({ resetKey }: { resetKey: string }) =>
        useInfiniteList<Item>({
          items: PAGE1,
          total: 10,
          page: 1,
          pageSize: 2,
          resetKey,
          loading: false,
          infiniteScroll: false,
          getId,
          onLoadMore: vi.fn(),
        }),
      { initialProps: { resetKey: "k1" } },
    );
    expect(result.current.accumulated).toHaveLength(2);
    rerender({ resetKey: "k2" });
    expect(result.current.accumulated).toEqual([]);
  });

  it("reports hasMore false when all items are loaded", () => {
    const { result } = renderHook(() =>
      useInfiniteList<Item>({
        items: PAGE1,
        total: 2,
        page: 1,
        pageSize: 2,
        resetKey: "k",
        loading: false,
        infiniteScroll: false,
        getId,
        onLoadMore: vi.fn(),
      }),
    );
    expect(result.current.hasMore).toBe(false);
  });

  it("invokes onLoadMore when the sentinel intersects", () => {
    const onLoadMore = vi.fn();
    let trigger: ((entries: unknown[]) => void) | null = null;
    class FakeObserver {
      constructor(cb: (entries: unknown[]) => void) {
        trigger = cb;
      }
      observe = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal("IntersectionObserver", FakeObserver);

    const Harness = () => {
      const { sentinelRef } = useInfiniteList<Item>({
        items: PAGE1,
        total: 10,
        page: 1,
        pageSize: 2,
        resetKey: "k",
        loading: false,
        infiniteScroll: true,
        getId,
        onLoadMore,
      });
      return <div ref={sentinelRef} data-testid="sentinel" />;
    };

    render(<Harness />);
    act(() => {
      trigger?.([{ isIntersecting: true }]);
    });
    expect(onLoadMore).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("does not load more while loading", () => {
    const onLoadMore = vi.fn();
    let trigger: ((entries: unknown[]) => void) | null = null;
    class FakeObserver {
      constructor(cb: (entries: unknown[]) => void) {
        trigger = cb;
      }
      observe = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal("IntersectionObserver", FakeObserver);

    const Harness = () => {
      const { sentinelRef } = useInfiniteList<Item>({
        items: PAGE1,
        total: 10,
        page: 1,
        pageSize: 2,
        resetKey: "k",
        loading: true,
        infiniteScroll: true,
        getId,
        onLoadMore,
      });
      return <div ref={sentinelRef} data-testid="sentinel" />;
    };

    render(<Harness />);
    act(() => {
      trigger?.([{ isIntersecting: true }]);
    });
    expect(onLoadMore).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
