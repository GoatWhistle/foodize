import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CreateOrderWebSocket } from "@shared/hooks/useOrderWebSocket";

const mocks = vi.hoisted(() => {
  const fetchOrder = vi.fn();
  const store = { currentOrder: null as Record<string, unknown> | null };
  const getState = vi.fn(() => ({ currentOrder: store.currentOrder, fetchOrder }));
  const setState = vi.fn((patch: { currentOrder?: Record<string, unknown> }) => {
    if (patch.currentOrder !== undefined) store.currentOrder = patch.currentOrder;
  });
  return { fetchOrder, store, getState, setState };
});

const { fetchOrder, getState, setState } = mocks;

vi.mock("@shared/store/useOrdersStore.instance", () => {
  const useOrdersStore = vi.fn((sel?: (s: unknown) => unknown) => {
    const state = { fetchOrder: mocks.fetchOrder };
    return sel ? sel(state) : state;
  }) as unknown as {
    (sel?: (s: unknown) => unknown): unknown;
    getState: typeof mocks.getState;
    setState: typeof mocks.setState;
  };
  useOrdersStore.getState = mocks.getState;
  useOrdersStore.setState = mocks.setState;
  return { useOrdersStore };
});

import { useOrderWebSocket } from "@shared/hooks/useOrderWebSocket";

interface FakeSocket {
  close: ReturnType<typeof vi.fn>;
}

const makeOrder = (status: string) => ({
  id: "o1",
  display_id: 5,
  status,
});

describe("useOrderWebSocket", () => {
  beforeEach(() => {
    fetchOrder.mockReset();
    getState.mockClear();
    setState.mockClear();
    mocks.store.currentOrder = null;
  });

  it("loads the order and opens a socket on mount", async () => {
    fetchOrder.mockResolvedValue(makeOrder("PENDING"));
    const socket: FakeSocket = { close: vi.fn() };
    const factory = vi.fn(() => socket) as unknown as CreateOrderWebSocket;

    renderHook(() => useOrderWebSocket("o1", factory));

    await waitFor(() => { expect(fetchOrder).toHaveBeenCalledWith("o1"); });
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("does nothing without an orderId or factory", () => {
    fetchOrder.mockResolvedValue(makeOrder("PENDING"));
    renderHook(() => useOrderWebSocket("", null));
    expect(fetchOrder).not.toHaveBeenCalled();
  });

  it("applies a valid message and calls onStatusChange on transition", () => {
    mocks.store.currentOrder = makeOrder("PENDING");
    fetchOrder.mockResolvedValue(makeOrder("PENDING"));
    let onMessage: ((d: Record<string, unknown>) => void) | undefined;
    const factory = vi.fn(
      (_id: string, msg: (d: Record<string, unknown>) => void) => {
        onMessage = msg;
        return { close: vi.fn() };
      },
    ) as unknown as CreateOrderWebSocket;
    const onStatusChange = vi.fn();

    renderHook(() => useOrderWebSocket("o1", factory, { onStatusChange }));

    act(() => {
      onMessage?.(makeOrder("PREPARING"));
    });

    expect(setState).toHaveBeenCalledWith({ currentOrder: makeOrder("PREPARING") });
    expect(onStatusChange).toHaveBeenCalledWith("PREPARING", "PENDING");
  });

  it("ignores error payloads", () => {
    fetchOrder.mockResolvedValue(makeOrder("PENDING"));
    let onMessage: ((d: Record<string, unknown>) => void) | undefined;
    const factory = vi.fn(
      (_id: string, msg: (d: Record<string, unknown>) => void) => {
        onMessage = msg;
        return { close: vi.fn() };
      },
    ) as unknown as CreateOrderWebSocket;

    renderHook(() => useOrderWebSocket("o1", factory));
    setState.mockClear();
    act(() => {
      onMessage?.({ error: "nope" });
    });
    expect(setState).not.toHaveBeenCalled();
  });

  it("ignores unparseable messages", () => {
    fetchOrder.mockResolvedValue(makeOrder("PENDING"));
    let onMessage: ((d: Record<string, unknown>) => void) | undefined;
    const factory = vi.fn(
      (_id: string, msg: (d: Record<string, unknown>) => void) => {
        onMessage = msg;
        return { close: vi.fn() };
      },
    ) as unknown as CreateOrderWebSocket;

    renderHook(() => useOrderWebSocket("o1", factory));
    setState.mockClear();
    act(() => {
      onMessage?.({ id: "x" });
    });
    expect(setState).not.toHaveBeenCalled();
  });

  it("reloads on close for non-terminal status", () => {
    mocks.store.currentOrder = makeOrder("PREPARING");
    fetchOrder.mockResolvedValue(makeOrder("PREPARING"));
    let onClose: (() => void) | undefined;
    const factory = vi.fn(
      (
        _id: string,
        _msg: (d: Record<string, unknown>) => void,
        close?: () => void,
      ) => {
        onClose = close;
        return { close: vi.fn() };
      },
    ) as unknown as CreateOrderWebSocket;

    renderHook(() => useOrderWebSocket("o1", factory));
    fetchOrder.mockClear();
    act(() => {
      onClose?.();
    });
    expect(fetchOrder).toHaveBeenCalledWith("o1");
  });

  it("does not reload on close for terminal status", () => {
    mocks.store.currentOrder = makeOrder("COMPLETED");
    fetchOrder.mockResolvedValue(makeOrder("COMPLETED"));
    let onClose: (() => void) | undefined;
    const factory = vi.fn(
      (
        _id: string,
        _msg: (d: Record<string, unknown>) => void,
        close?: () => void,
      ) => {
        onClose = close;
        return { close: vi.fn() };
      },
    ) as unknown as CreateOrderWebSocket;

    renderHook(() => useOrderWebSocket("o1", factory));
    fetchOrder.mockClear();
    act(() => {
      onClose?.();
    });
    expect(fetchOrder).not.toHaveBeenCalled();
  });

  it("closes the socket on unmount", () => {
    fetchOrder.mockResolvedValue(makeOrder("PENDING"));
    const close = vi.fn();
    const factory = vi.fn(() => ({ close })) as unknown as CreateOrderWebSocket;

    const { unmount } = renderHook(() => useOrderWebSocket("o1", factory));
    unmount();
    expect(close).toHaveBeenCalled();
  });

  it("exposes loadOrder that calls fetchOrder", async () => {
    fetchOrder.mockResolvedValue(makeOrder("PENDING"));
    const { result } = renderHook(() => useOrderWebSocket("o1", null));
    await act(async () => {
      await result.current.loadOrder();
    });
    expect(fetchOrder).toHaveBeenCalledWith("o1");
  });
});
