import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAdminFinance } from '../../../../pages/admin/hooks/useAdminFinance';
import { t } from '@shared/i18n/useTranslation';

vi.mock('../../../../services/adminService', () => ({
  adminService: {
    getFinance: vi.fn(),
    getAdvancedAnalytics: vi.fn(),
    getRestaurants: vi.fn(),
  },
}));

const { adminService } = await import('../../../../services/adminService');

const setActionError = vi.fn();
const todayStr = '2026-07-18';

const baseArgs = () => ({ activeTab: 'finance', setActionError, todayStr });

const okAll = () => {
  vi.mocked(adminService.getFinance).mockResolvedValue({ revenue_by_day: [] } as unknown as Awaited<
    ReturnType<typeof adminService.getFinance>
  >);
  vi.mocked(adminService.getAdvancedAnalytics).mockResolvedValue({
    aov_dynamics: [],
  } as unknown as Awaited<ReturnType<typeof adminService.getAdvancedAnalytics>>);
  vi.mocked(adminService.getRestaurants).mockResolvedValue({
    items: [{ id: 'r1', name: 'Мама Рома' }],
    total: 1,
  } as unknown as Awaited<ReturnType<typeof adminService.getRestaurants>>);
};

describe('useAdminFinance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch when tab is inactive', () => {
    okAll();
    renderHook(() => useAdminFinance({ ...baseArgs(), activeTab: 'users' }));
    expect(adminService.getFinance).not.toHaveBeenCalled();
    expect(adminService.getRestaurants).not.toHaveBeenCalled();
  });

  it('fetches finance, analytics and restaurants', async () => {
    okAll();
    const { result } = renderHook(() => useAdminFinance(baseArgs()));
    await waitFor(() => { expect(result.current.finance).toBeTruthy(); });
    expect(result.current.advancedAnalytics).toBeTruthy();
    await waitFor(() => { expect(result.current.allRestaurants).toHaveLength(1); });
    expect(result.current.financeLoading).toBe(false);
    expect(result.current.analyticsLoading).toBe(false);
  });

  it('passes only non-empty filters as params', async () => {
    okAll();
    const { result } = renderHook(() => useAdminFinance(baseArgs()));
    await waitFor(() => { expect(adminService.getFinance).toHaveBeenCalled(); });
    act(() =>
      { result.current.setFinanceFilters({
        date_from: '2026-01-01',
        date_to: '',
        restaurant_id: 'r1',
      }); },
    );
    await waitFor(() =>
      { expect(adminService.getFinance).toHaveBeenLastCalledWith({
        date_from: '2026-01-01',
        restaurant_id: 'r1',
      }); },
    );
  });

  it('reports fetch error', async () => {
    vi.mocked(adminService.getRestaurants).mockResolvedValue({
      items: [],
      total: 0,
    });
    vi.mocked(adminService.getFinance).mockRejectedValue(new Error('x'));
    vi.mocked(adminService.getAdvancedAnalytics).mockResolvedValue({} as unknown as Awaited<
      ReturnType<typeof adminService.getAdvancedAnalytics>
    >);
    renderHook(() => useAdminFinance(baseArgs()));
    await waitFor(() =>
      { expect(setActionError).toHaveBeenCalledWith(t('admin.finance.errors.loadFailed')); },
    );
  });

  it('builds restaurant label from selection and falls back to all-restaurants', async () => {
    okAll();
    const { result } = renderHook(() => useAdminFinance(baseArgs()));
    await waitFor(() => { expect(result.current.allRestaurants).toHaveLength(1); });
    expect(result.current.getRestaurantLabel()).toBe(t('admin.exportFiles.allRestaurants'));
    act(() =>
      { result.current.setFinanceFilters((prev) => ({ ...prev, restaurant_id: 'r1' })); },
    );
    await waitFor(() => { expect(result.current.getRestaurantLabel()).toBe('Мама_Рома'); });
    act(() =>
      { result.current.setFinanceFilters((prev) => ({ ...prev, restaurant_id: 'missing' })); },
    );
    await waitFor(() => { expect(result.current.getRestaurantLabel()).toBe(t('admin.exportFiles.allRestaurants')); });
  });

  it('builds date range label with defaults and custom values', async () => {
    okAll();
    const { result } = renderHook(() => useAdminFinance(baseArgs()));
    expect(result.current.getDateRangeLabel()).toBe(`${todayStr}_${todayStr}`);
    act(() =>
      { result.current.setFinanceFilters({
        date_from: '2026-01-01',
        date_to: '2026-02-01',
        restaurant_id: '',
      }); },
    );
    await waitFor(() =>
      { expect(result.current.getDateRangeLabel()).toBe('2026-01-01_2026-02-01'); },
    );
  });

  it('exposes preset control', () => {
    okAll();
    const { result } = renderHook(() => useAdminFinance(baseArgs()));
    act(() => { result.current.setActivePreset(7); });
    expect(result.current.activePreset).toBe(7);
  });
});
