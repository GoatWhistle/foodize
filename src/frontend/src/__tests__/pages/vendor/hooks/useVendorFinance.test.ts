import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVendorFinance } from '../../../../pages/vendor/hooks/useVendorFinance';
import { vendorService } from '@shared/services/vendorService';
import type { Restaurant } from '@shared/types/models';

vi.mock('@shared/services/vendorService', () => ({
  vendorService: {
    getFinance: vi.fn(),
    getAdvancedAnalytics: vi.fn(),
  },
}));

vi.mock('@shared/utils/logError', () => ({ logError: vi.fn() }));

const restaurant = { id: 'r1' } as unknown as Restaurant;
const dataResp = (data: unknown) => ({ data: { data } }) as never;

describe('useVendorFinance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vendorService.getFinance).mockResolvedValue(dataResp({ total_orders: 5 }));
    vi.mocked(vendorService.getAdvancedAnalytics).mockResolvedValue(dataResp({ hourly_load: [] }));
  });

  it('does not fetch when tab is not analytics', () => {
    renderHook(() => useVendorFinance({ selectedRestaurant: restaurant, activeTab: 'orders' }));
    expect(vendorService.getFinance).not.toHaveBeenCalled();
  });

  it('does not fetch when no restaurant selected', () => {
    renderHook(() => useVendorFinance({ selectedRestaurant: null, activeTab: 'analytics' }));
    expect(vendorService.getFinance).not.toHaveBeenCalled();
  });

  it('fetches finance and advanced analytics on analytics tab', async () => {
    const { result } = renderHook(() =>
      useVendorFinance({ selectedRestaurant: restaurant, activeTab: 'analytics' })
    );
    await waitFor(() => {
      expect(result.current.finance).toEqual({ total_orders: 5 });
      expect(result.current.advancedAnalytics).toEqual({ hourly_load: [] });
    });
    expect(result.current.financeLoading).toBe(false);
    expect(result.current.analyticsLoading).toBe(false);
  });

  it('filters out empty filter values in params', async () => {
    const { result } = renderHook(() =>
      useVendorFinance({ selectedRestaurant: restaurant, activeTab: 'analytics' })
    );
    await waitFor(() => { expect(vendorService.getFinance).toHaveBeenCalled(); });
    expect(vendorService.getFinance).toHaveBeenCalledWith({ restaurant_id: 'r1' });

    act(() => { result.current.setFinanceFilters({ date_from: '2026-01-01', date_to: '' }); });
    await waitFor(() =>
      { expect(vendorService.getFinance).toHaveBeenLastCalledWith({ restaurant_id: 'r1', date_from: '2026-01-01' }); }
    );
  });

  it('logs error when a request fails', async () => {
    vi.mocked(vendorService.getFinance).mockRejectedValue(new Error('boom'));
    const { logError } = await import('@shared/utils/logError');
    renderHook(() => useVendorFinance({ selectedRestaurant: restaurant, activeTab: 'analytics' }));
    await waitFor(() => { expect(logError).toHaveBeenCalledWith('useVendorFinance.load', expect.any(Error)); });
  });

  it('exposes preset setter', () => {
    const { result } = renderHook(() =>
      useVendorFinance({ selectedRestaurant: restaurant, activeTab: 'orders' })
    );
    act(() => { result.current.setActivePreset(7); });
    expect(result.current.activePreset).toBe(7);
  });
});
