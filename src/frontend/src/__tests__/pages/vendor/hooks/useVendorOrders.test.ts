import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVendorOrders } from '../../../../pages/vendor/hooks/useVendorOrders';
import { orderService } from '@shared/services/orderService';
import { useVendorOrdersWebSocket } from '../../../../hooks/useVendorOrdersWebSocket';
import type { Order, Restaurant } from '@shared/types/models';

vi.mock('@shared/services/orderService', () => ({
  orderService: {
    getByRestaurant: vi.fn(),
    updateStatus: vi.fn(),
    cancelOrder: vi.fn(),
  },
}));

vi.mock('../../../../hooks/useVendorOrdersWebSocket', () => ({
  useVendorOrdersWebSocket: vi.fn(),
}));

vi.mock('@shared/utils/translateApiError', () => ({
  translateApiError: (_e: unknown, fallback: string) => fallback,
}));

const restaurant = { id: 'r1' } as unknown as Restaurant;

const ordersResp = (items: unknown[], total?: number) =>
  ({ data: { data: items, pagination: { total: total ?? items.length } } }) as unknown as Awaited<
    ReturnType<typeof orderService.getByRestaurant>
  >;

describe('useVendorOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(orderService.getByRestaurant).mockResolvedValue(
      ordersResp([{ id: 'o1', status: 'PENDING' }], 1)
    );
  });

  it('does not fetch when tab is not orders', () => {
    renderHook(() => useVendorOrders({ selectedRestaurant: restaurant, activeTab: 'menu' }));
    expect(orderService.getByRestaurant).not.toHaveBeenCalled();
  });

  it('fetches orders when tab is orders', async () => {
    const { result } = renderHook(() =>
      useVendorOrders({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    await waitFor(() => { expect(result.current.restaurantOrders).toHaveLength(1); });
    expect(result.current.ordersTotal).toBe(1);
    expect(result.current.ordersLoading).toBe(false);
  });

  it('handles non-array orders payload', async () => {
    vi.mocked(orderService.getByRestaurant).mockResolvedValue(ordersResp(null as never, 0));
    const { result } = renderHook(() =>
      useVendorOrders({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    await waitFor(() => { expect(orderService.getByRestaurant).toHaveBeenCalled(); });
    expect(result.current.restaurantOrders).toEqual([]);
  });

  it('sets error and resets on fetch failure', async () => {
    vi.mocked(orderService.getByRestaurant).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() =>
      useVendorOrders({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    await waitFor(() => { expect(result.current.ordersError).toContain('Не удалось загрузить заказы'); });
    expect(result.current.restaurantOrders).toEqual([]);
    expect(result.current.ordersTotal).toBe(0);
  });

  it('passes filter params to the service', async () => {
    const { result } = renderHook(() =>
      useVendorOrders({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    await waitFor(() => { expect(orderService.getByRestaurant).toHaveBeenCalled(); });
    act(() => {
      result.current.setOrdersStatusFilter('READY');
      result.current.setOrdersDateFromFilter('2026-01-01');
      result.current.setOrdersDateToFilter('2026-01-31');
    });
    await waitFor(() =>
      { expect(orderService.getByRestaurant).toHaveBeenLastCalledWith('r1', {
        page: 1,
        size: 20,
        status: 'READY',
        date_from: '2026-01-01',
        date_to: '2026-01-31',
      }); }
    );
  });

  it('registers the websocket handler', () => {
    renderHook(() => useVendorOrders({ selectedRestaurant: restaurant, activeTab: 'orders' }));
    expect(useVendorOrdersWebSocket).toHaveBeenCalledWith('r1', 'orders', expect.any(Function));
  });

  it('refetches when websocket handler fires', async () => {
    renderHook(() => useVendorOrders({ selectedRestaurant: restaurant, activeTab: 'orders' }));
    await waitFor(() => { expect(orderService.getByRestaurant).toHaveBeenCalled(); });
    const handler = vi.mocked(useVendorOrdersWebSocket).mock.calls.at(-1)?.[2] as () => void;
    vi.mocked(orderService.getByRestaurant).mockClear();
    await act(async () => {
      handler();
      await Promise.resolve();
    });
    await waitFor(() => { expect(orderService.getByRestaurant).toHaveBeenCalled(); });
  });

  it('handleOrderChange updates status and refreshes', async () => {
    vi.mocked(orderService.updateStatus).mockResolvedValue({} as never);
    const { result } = renderHook(() =>
      useVendorOrders({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    await waitFor(() => { expect(result.current.restaurantOrders).toHaveLength(1); });
    act(() => { result.current.setSelectedOrder({ id: 'o1', status: 'PENDING' } as unknown as Order); });
    await act(async () => {
      await result.current.handleOrderChange('o1', 'ACCEPTED', { estimated_ready_in_minutes: 10 });
    });
    expect(orderService.updateStatus).toHaveBeenCalledWith('o1', 'ACCEPTED', { estimated_ready_in_minutes: 10 });
    expect(result.current.selectedOrder?.status).toBe('ACCEPTED');
    expect(result.current.selectedOrder?.estimated_ready_at).toBeTruthy();
  });

  it('handleOrderChange applies explicit estimated_ready_at and leaves other orders', async () => {
    vi.mocked(orderService.updateStatus).mockResolvedValue({} as never);
    const { result } = renderHook(() =>
      useVendorOrders({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    await waitFor(() => { expect(orderService.getByRestaurant).toHaveBeenCalled(); });
    act(() => { result.current.setSelectedOrder({ id: 'other', status: 'PENDING' } as unknown as Order); });
    await act(async () => {
      await result.current.handleOrderChange('o1', 'READY', { estimated_ready_at: '2026-07-18T12:00:00Z' });
    });
    expect(result.current.selectedOrder?.id).toBe('other');
  });

  it('handleOrderChange sets error on failure', async () => {
    vi.mocked(orderService.updateStatus).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() =>
      useVendorOrders({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    await waitFor(() => { expect(orderService.getByRestaurant).toHaveBeenCalled(); });
    await act(async () => {
      await result.current.handleOrderChange('o1', 'ACCEPTED');
    });
    expect(result.current.ordersError).toBe('Не удалось изменить статус заказа');
    expect(result.current.updatingOrderId).toBeNull();
  });

  it('handleCancelOrder cancels the selected order and refreshes', async () => {
    vi.mocked(orderService.cancelOrder).mockResolvedValue({} as never);
    const { result } = renderHook(() =>
      useVendorOrders({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    await waitFor(() => { expect(orderService.getByRestaurant).toHaveBeenCalled(); });
    act(() => { result.current.setSelectedOrder({ id: 'o1', status: 'PENDING' } as unknown as Order); });
    await act(async () => {
      await result.current.handleCancelOrder('o1', 'нет продуктов');
    });
    expect(orderService.cancelOrder).toHaveBeenCalledWith('o1', 'нет продуктов');
    expect(result.current.selectedOrder?.status).toBe('CANCELLED');
  });

  it('handleCancelOrder sets error on failure', async () => {
    vi.mocked(orderService.cancelOrder).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() =>
      useVendorOrders({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    await waitFor(() => { expect(orderService.getByRestaurant).toHaveBeenCalled(); });
    await act(async () => {
      await result.current.handleCancelOrder('o1', 'reason');
    });
    expect(result.current.ordersError).toBe('Не удалось отменить заказ');
  });

  it('fetchVendorOrders returns early with no restaurant', async () => {
    const { result } = renderHook(() =>
      useVendorOrders({ selectedRestaurant: null, activeTab: 'orders' })
    );
    await act(async () => {
      await result.current.fetchVendorOrders();
    });
    expect(orderService.getByRestaurant).not.toHaveBeenCalled();
  });

  it('changes page through setter', async () => {
    const { result } = renderHook(() =>
      useVendorOrders({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    await waitFor(() => { expect(orderService.getByRestaurant).toHaveBeenCalled(); });
    act(() => { result.current.setOrdersPage(2); });
    await waitFor(() =>
      { expect(orderService.getByRestaurant).toHaveBeenLastCalledWith('r1', expect.objectContaining({ page: 2 })); }
    );
  });
});
