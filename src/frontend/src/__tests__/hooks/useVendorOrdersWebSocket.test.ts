import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  createRestaurantOrdersWebSocket: vi.fn(),
}));

const { createRestaurantOrdersWebSocket } = await import('../../services/api');
const { useVendorOrdersWebSocket } = await import('../../hooks/useVendorOrdersWebSocket');

describe('useVendorOrdersWebSocket', () => {
  const close = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createRestaurantOrdersWebSocket).mockReturnValue({
      close,
    } as unknown as ReturnType<typeof createRestaurantOrdersWebSocket>);
  });

  it('does not connect when restaurantId is missing', () => {
    renderHook(() => { useVendorOrdersWebSocket(null, 'orders', vi.fn()); });
    expect(createRestaurantOrdersWebSocket).not.toHaveBeenCalled();
  });

  it('does not connect when tab is not orders', () => {
    renderHook(() => { useVendorOrdersWebSocket('r1', 'menu', vi.fn()); });
    expect(createRestaurantOrdersWebSocket).not.toHaveBeenCalled();
  });

  it('connects and passes the message handler', () => {
    const onMessage = vi.fn();
    renderHook(() => { useVendorOrdersWebSocket('r1', 'orders', onMessage); });
    expect(createRestaurantOrdersWebSocket).toHaveBeenCalledWith('r1', onMessage);
  });

  it('closes the socket on unmount', () => {
    const { unmount } = renderHook(() =>
      { useVendorOrdersWebSocket('r1', 'orders', vi.fn()); }
    );
    unmount();
    expect(close).toHaveBeenCalled();
  });

  it('reconnects when restaurantId changes', () => {
    const { rerender } = renderHook(
      ({ id }: { id: string }) => { useVendorOrdersWebSocket(id, 'orders', vi.fn()); },
      { initialProps: { id: 'r1' } }
    );
    expect(createRestaurantOrdersWebSocket).toHaveBeenCalledTimes(1);
    rerender({ id: 'r2' });
    expect(close).toHaveBeenCalled();
    expect(createRestaurantOrdersWebSocket).toHaveBeenCalledTimes(2);
  });
});
