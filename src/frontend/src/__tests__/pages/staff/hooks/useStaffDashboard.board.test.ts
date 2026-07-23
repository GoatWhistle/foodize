import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { COLUMN_DEFS } from '../../../../pages/staff/staffColumns';
import { at, req } from '../../../testUtils';
import { t } from '@shared/i18n/useTranslation';

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
const { order, menuItem, mockResolved, setupHappy, renderReady } = await import(
  './useStaffDashboardTestUtils'
);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  setupHappy();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useStaffDashboard actions and board', () => {
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
      { expect(result.current.orderActionError).toBe(t('staff.errors.acceptOrderFailed')); }
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
      { expect(result.current.orderActionError).toBe(t('staff.errors.cancelOrderFailed')); }
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
    expect(result.current.menuError).toBe(t('staff.errors.toggleAvailabilityFailed'));
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
