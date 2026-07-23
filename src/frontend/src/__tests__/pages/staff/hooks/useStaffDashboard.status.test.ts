import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
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
const { useStaffDashboard } = await import(
  '../../../../pages/staff/hooks/useStaffDashboard'
);
const { PROFILE, order, mockResolved, setupHappy, renderReady } = await import(
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

describe('useStaffDashboard loading and status flow', () => {
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
    await waitFor(() => { expect(result.current.menuError).toBe(t('staff.errors.menuLoadFailed')); });
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
      { expect(result.current.orderActionError).toBe(t('staff.errors.statusUpdateFailed')); }
    );
  });
});
