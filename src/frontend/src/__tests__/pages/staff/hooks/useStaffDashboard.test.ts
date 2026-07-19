import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { StaffProfile, MenuItem } from '@shared/types/models';
import type { StaffOrder } from '../../../../pages/staff/types';
import { COLUMN_DEFS } from '../../../../pages/staff/staffColumns';
import { at, req } from '../../../testUtils';

vi.mock('@shared/services/staffService', () => ({
  staffService: {
    getMyProfile: vi.fn(),
    getRestaurantOrders: vi.fn(),
    getMenu: vi.fn(),
    updateOrderStatus: vi.fn(),
    cancelOrder: vi.fn(),
    toggleMenuItemAvailability: vi.fn(),
  },
}));

vi.mock('../../../../services/api', () => ({
  createRestaurantOrdersWebSocket: vi.fn(() => ({ close: vi.fn() })),
}));

vi.mock('@shared/utils/logError', () => ({ logError: vi.fn() }));
vi.mock('@shared/utils/translateApiError', () => ({
  translateApiError: (_e: unknown, fallback: string) => fallback,
}));

const { staffService } = await import('@shared/services/staffService');
const api = await import('../../../../services/api');
const { useStaffDashboard } = await import(
  '../../../../pages/staff/hooks/useStaffDashboard'
);

const PROFILE = {
  restaurant_id: 'r1',
  role: 'COOK',
} as unknown as StaffProfile;

const order = (over: Partial<StaffOrder>): StaffOrder =>
  ({
    id: 'o1',
    status: 'PENDING',
    items: [{ menu_item_prep_time: 20 }],
    created_at: new Date().toISOString(),
    ...over,
  }) as unknown as StaffOrder;

const menuItem: MenuItem = { id: 'm1', is_available: true } as unknown as MenuItem;

const mockResolved = (fn: ReturnType<typeof vi.fn>, data: unknown) =>
  vi.mocked(fn).mockResolvedValue({ data: { data } });

const setupHappy = (orders: StaffOrder[] = [order({})]) => {
  mockResolved(staffService.getMyProfile as never, PROFILE);
  mockResolved(staffService.getRestaurantOrders as never, orders);
  mockResolved(staffService.getMenu as never, [menuItem]);
  vi.mocked(staffService.updateOrderStatus).mockResolvedValue({} as never);
  vi.mocked(staffService.cancelOrder).mockResolvedValue({} as never);
  vi.mocked(staffService.toggleMenuItemAvailability).mockResolvedValue({} as never);
};

const renderReady = async () => {
  const hook = renderHook(() => useStaffDashboard());
  await waitFor(() => { expect(hook.result.current.profile).not.toBeNull(); });
  await waitFor(() => { expect(hook.result.current.ordersLoading).toBe(false); });
  return hook;
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  setupHappy();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useStaffDashboard', () => {
  it('loads profile, orders and menu', async () => {
    const { result } = await renderReady();
    expect(result.current.orders).toHaveLength(1);
    expect(result.current.menuItems).toHaveLength(1);
    expect(api.createRestaurantOrdersWebSocket).toHaveBeenCalledWith('r1', expect.any(Function));
  });

  it('sets profileError when profile fetch fails', async () => {
    vi.mocked(staffService.getMyProfile).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useStaffDashboard());
    await waitFor(() => { expect(result.current.profileError).toBe('error'); });
    expect(result.current.profileLoading).toBe(false);
  });

  it('sets menuError when menu fetch fails', async () => {
    mockResolved(staffService.getMyProfile as never, PROFILE);
    mockResolved(staffService.getRestaurantOrders as never, [order({})]);
    vi.mocked(staffService.getMenu).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useStaffDashboard());
    await waitFor(() => { expect(result.current.menuError).toBe('Не удалось загрузить меню'); });
  });

  it('initializes autoEta from localStorage', async () => {
    localStorage.setItem('staff_auto_eta', 'true');
    const { result } = await renderReady();
    expect(result.current.autoEta).toBe(true);
  });

  it('handleAdvance with autoEta accepts a PENDING order using max prep time', async () => {
    localStorage.setItem('staff_auto_eta', 'true');
    const { result } = await renderReady();
    await act(async () => {
      result.current.handleAdvance(order({ id: 'o1', status: 'PENDING' }));
      await Promise.resolve();
    });
    expect(staffService.updateOrderStatus).toHaveBeenCalledWith('o1', 'ACCEPTED', {
      estimated_ready_in_minutes: 20,
    });
  });

  it('handleAdvance with autoEta and no prep times defaults to 15', async () => {
    localStorage.setItem('staff_auto_eta', 'true');
    const { result } = await renderReady();
    await act(async () => {
      result.current.handleAdvance(
        order({ id: 'o1', status: 'PENDING', items: [{ menu_item_prep_time: 0 }] as never })
      );
      await Promise.resolve();
    });
    expect(staffService.updateOrderStatus).toHaveBeenCalledWith('o1', 'ACCEPTED', {
      estimated_ready_in_minutes: 15,
    });
  });

  it('handleAdvance without autoEta opens eta modal', async () => {
    const { result } = await renderReady();
    act(() => {
      result.current.handleAdvance(order({ id: 'o1', status: 'PENDING' }));
    });
    expect(result.current.etaOrder?.id).toBe('o1');
  });

  it('handleAdvance moves ACCEPTED to READY', async () => {
    const { result } = await renderReady();
    await act(async () => {
      result.current.handleAdvance(order({ id: 'o1', status: 'ACCEPTED' }));
      await Promise.resolve();
    });
    expect(staffService.updateOrderStatus).toHaveBeenCalledWith('o1', 'READY');
  });

  it('handleAdvance moves READY to COMPLETED', async () => {
    const { result } = await renderReady();
    await act(async () => {
      result.current.handleAdvance(order({ id: 'o1', status: 'READY' }));
      await Promise.resolve();
    });
    expect(staffService.updateOrderStatus).toHaveBeenCalledWith('o1', 'COMPLETED');
  });

  it('doStatusChange sets orderActionError on failure', async () => {
    const { result } = await renderReady();
    vi.mocked(staffService.updateOrderStatus).mockRejectedValueOnce(new Error('fail'));
    await act(async () => {
      result.current.handleAdvance(order({ id: 'o1', status: 'ACCEPTED' }));
      await Promise.resolve();
    });
    await waitFor(() =>
      { expect(result.current.orderActionError).toBe('Не удалось обновить статус'); }
    );
  });

  it('handleEtaConfirm accepts the pending eta order', async () => {
    const { result } = await renderReady();
    act(() => {
      result.current.handleAdvance(order({ id: 'o1', status: 'PENDING' }));
    });
    await act(async () => {
      result.current.handleEtaConfirm({ estimated_ready_in_minutes: 25 });
      await Promise.resolve();
    });
    expect(result.current.etaOrder).toBeNull();
    expect(staffService.updateOrderStatus).toHaveBeenCalledWith('o1', 'ACCEPTED', {
      estimated_ready_in_minutes: 25,
    });
  });

  it('acceptOrder sets error on failure', async () => {
    const { result } = await renderReady();
    act(() => {
      result.current.handleAdvance(order({ id: 'o1', status: 'PENDING' }));
    });
    vi.mocked(staffService.updateOrderStatus).mockRejectedValueOnce(new Error('fail'));
    await act(async () => {
      result.current.handleEtaConfirm({ estimated_ready_in_minutes: 25 });
      await Promise.resolve();
    });
    await waitFor(() =>
      { expect(result.current.orderActionError).toBe('Не удалось принять заказ'); }
    );
  });

  it('handleCancelOrder cancels and reloads', async () => {
    const { result } = await renderReady();
    await act(async () => {
      await result.current.handleCancelOrder('o1', 'reason');
    });
    expect(staffService.cancelOrder).toHaveBeenCalledWith('o1', 'reason');
  });

  it('handleCancelOrder sets error on failure', async () => {
    const { result } = await renderReady();
    vi.mocked(staffService.cancelOrder).mockRejectedValueOnce(new Error('x'));
    await act(async () => {
      await result.current.handleCancelOrder('o1', null);
    });
    await waitFor(() =>
      { expect(result.current.orderActionError).toBe('Не удалось отменить заказ'); }
    );
  });

  it('handleToggleAvailability optimistically updates and persists', async () => {
    const { result } = await renderReady();
    await act(async () => {
      await result.current.handleToggleAvailability(menuItem);
    });
    expect(staffService.toggleMenuItemAvailability).toHaveBeenCalledWith('r1', 'm1', false);
    expect(result.current.menuItems[0]?.is_available).toBe(false);
  });

  it('handleToggleAvailability rolls back on failure', async () => {
    const { result } = await renderReady();
    vi.mocked(staffService.toggleMenuItemAvailability).mockRejectedValueOnce(new Error('x'));
    await act(async () => {
      await result.current.handleToggleAvailability(menuItem);
    });
    await waitFor(() => { expect(result.current.menuItems[0]?.is_available).toBe(true); });
    expect(result.current.menuError).toBe('Не удалось изменить статус блюда');
  });

  it('drag flow: onDragStart sets id, handleDrop triggers cooking for pending->accepted', async () => {
    const { result } = await renderReady();
    const o = order({ id: 'o1', status: 'PENDING' });
    act(() => {
      result.current.onDragStart(o);
    });
    expect(result.current.draggingOrderId).toBe('o1');
    const acceptedCol = req(COLUMN_DEFS.find((c) => c.id === 'accepted'));
    act(() => {
      result.current.handleDrop(acceptedCol);
    });
    expect(result.current.etaOrder?.id).toBe('o1');
  });

  it('handleDrop advances accepted->ready', async () => {
    const { result } = await renderReady();
    act(() => {
      result.current.onDragStart(order({ id: 'o1', status: 'ACCEPTED' }));
    });
    const readyCol = req(COLUMN_DEFS.find((c) => c.id === 'ready'));
    await act(async () => {
      result.current.handleDrop(readyCol);
      await Promise.resolve();
    });
    expect(staffService.updateOrderStatus).toHaveBeenCalledWith('o1', 'READY');
  });

  it('handleDrop is a noop when dropping on same column', async () => {
    const { result } = await renderReady();
    act(() => {
      result.current.onDragStart(order({ id: 'o1', status: 'PENDING' }));
    });
    const pendingCol = req(COLUMN_DEFS.find((c) => c.id === 'pending'));
    act(() => {
      result.current.handleDrop(pendingCol);
    });
    expect(result.current.etaOrder).toBeNull();
  });

  it('handleDrop is a noop with no dragging order', async () => {
    const { result } = await renderReady();
    const readyCol = req(COLUMN_DEFS.find((c) => c.id === 'ready'));
    act(() => {
      result.current.handleDrop(readyCol);
    });
    expect(staffService.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('onDragEnd clears dragging id', async () => {
    const { result } = await renderReady();
    act(() => {
      result.current.onDragStart(order({ id: 'o1' }));
    });
    expect(result.current.draggingOrderId).toBe('o1');
    act(() => {
      result.current.onDragEnd();
    });
    await waitFor(() => { expect(result.current.draggingOrderId).toBeNull(); });
  });

  it('websocket callback triggers a silent order refresh', async () => {
    await renderReady();
    const wsCall = at(vi.mocked(api.createRestaurantOrdersWebSocket).mock.calls, 0);
    const onMsg = wsCall[1] as () => void;
    const before = vi.mocked(staffService.getRestaurantOrders).mock.calls.length;
    await act(async () => {
      onMsg();
      await Promise.resolve();
    });
    await waitFor(() =>
      { expect(
        vi.mocked(staffService.getRestaurantOrders).mock.calls.length
      ).toBeGreaterThan(before); }
    );
  });

  it('raises newOrderAlert when a new order id appears on refetch', async () => {
    const { result } = await renderReady();
    mockResolved(staffService.getRestaurantOrders as never, [
      order({ id: 'o1' }),
      order({ id: 'o2' }),
    ]);
    const onMsg = at(vi.mocked(api.createRestaurantOrdersWebSocket).mock.calls, 0)[1] as () => void;
    await act(async () => {
      onMsg();
      await Promise.resolve();
    });
    await waitFor(() => { expect(result.current.newOrderAlert).toBe(true); });
  });

  it('exposes tab setters', async () => {
    const { result } = await renderReady();
    act(() => {
      result.current.setActiveTab('menu');
    });
    expect(result.current.activeTab).toBe('menu');
    act(() => {
      result.current.setNewOrderAlert(false);
      result.current.setAutoEta(true);
      result.current.setEtaOrder(null);
    });
    expect(result.current.autoEta).toBe(true);
  });
});
