import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVendorRestaurants } from '../../../../pages/vendor/hooks/useVendorRestaurants';
import { useRestaurantStore } from '@shared/store/useRestaurantStore';
import { vendorService } from '@shared/services/vendorService';
import { restaurantService } from '@shared/services/restaurantService';
import type { Restaurant } from '@shared/types/models';
import { at } from '../../../testUtils';
import { t } from '@shared/i18n/useTranslation';
import { dataResp, makeParams, storeState } from './vendorRestaurantsHarness';

vi.mock('@shared/store/useRestaurantStore', () => ({
  useRestaurantStore: vi.fn((sel?: (s: typeof storeState) => unknown) => (sel ? sel(storeState) : storeState)),
}));

vi.mock('@shared/services/vendorService', () => ({
  vendorService: { getMyProfile: vi.fn() },
}));

vi.mock('@shared/services/restaurantService', () => ({
  restaurantService: {
    getWorkingHours: vi.fn(),
    setWorkingHours: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@shared/utils/translateApiError', () => ({
  translateApiError: (_e: unknown, fallback: string) => fallback,
}));

vi.mock('@shared/utils/logError', () => ({ logError: vi.fn() }));

describe('useVendorRestaurants working hours', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vendorService.getMyProfile).mockResolvedValue(dataResp({ approval_status: 'APPROVED' }));
    vi.mocked(restaurantService.getWorkingHours).mockResolvedValue(dataResp([]));
    void useRestaurantStore;
  });

  it('loads working hours defaults when none saved on schedule tab', async () => {
    const { result } = renderHook(() => useVendorRestaurants(makeParams('schedule')));
    act(() => { result.current.setSelectedRestaurant({ id: 'r1' } as Restaurant); });
    await waitFor(() => { expect(result.current.workingHours.length).toBe(7); });
  });

  it('loads and sorts saved working hours', async () => {
    vi.mocked(restaurantService.getWorkingHours).mockResolvedValue(
      dataResp([
        { day_of_week: 2, open_time: '08:00:00', close_time: '20:00:00', is_closed: false },
        { day_of_week: 0, open_time: '09:00:00', close_time: '21:00:00', is_closed: false },
      ])
    );
    const { result } = renderHook(() => useVendorRestaurants(makeParams('schedule')));
    act(() => { result.current.setSelectedRestaurant({ id: 'r1' } as Restaurant); });
    await waitFor(() => { expect(result.current.workingHours.length).toBe(2); });
    expect(at(result.current.workingHours, 0).day_of_week).toBe(0);
  });

  it('shows working hours error on non-404 failure', async () => {
    vi.mocked(restaurantService.getWorkingHours).mockRejectedValue({ response: { status: 500 } });
    const { result } = renderHook(() => useVendorRestaurants(makeParams('schedule')));
    act(() => { result.current.setSelectedRestaurant({ id: 'r1' } as Restaurant); });
    await waitFor(() => { expect(result.current.workingHoursError).toBe(t('vendor.schedule.errors.loadFailed')); });
  });

  it('suppresses working hours error on 404', async () => {
    vi.mocked(restaurantService.getWorkingHours).mockRejectedValue({ response: { status: 404 } });
    const { result } = renderHook(() => useVendorRestaurants(makeParams('schedule')));
    act(() => { result.current.setSelectedRestaurant({ id: 'r1' } as Restaurant); });
    await waitFor(() => { expect(result.current.workingHours.length).toBe(7); });
    expect(result.current.workingHoursError).toBe('');
  });

  it('saves working hours successfully', async () => {
    vi.useFakeTimers();
    vi.mocked(restaurantService.setWorkingHours).mockResolvedValue(
      dataResp([{ day_of_week: 0, open_time: '10:00:00', close_time: '20:00:00', is_closed: false }])
    );
    const { result } = renderHook(() => useVendorRestaurants(makeParams('schedule')));
    act(() => { result.current.setSelectedRestaurant({ id: 'r1' } as Restaurant); });
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.handleSaveWorkingHours();
    });
    expect(restaurantService.setWorkingHours).toHaveBeenCalled();
    expect(result.current.workingHoursSaved).toBe(true);
    void act(() => vi.advanceTimersByTime(2000));
    expect(result.current.workingHoursSaved).toBe(false);
    vi.useRealTimers();
  });

  it('save working hours returns early with no restaurant', async () => {
    const { result } = renderHook(() => useVendorRestaurants(makeParams()));
    await act(async () => {
      await result.current.handleSaveWorkingHours();
    });
    expect(restaurantService.setWorkingHours).not.toHaveBeenCalled();
  });

  it('sets error when saving working hours fails', async () => {
    vi.mocked(restaurantService.setWorkingHours).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useVendorRestaurants(makeParams('schedule')));
    act(() => { result.current.setSelectedRestaurant({ id: 'r1' } as Restaurant); });
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.handleSaveWorkingHours();
    });
    expect(result.current.workingHoursError).toBe(t('vendor.schedule.errors.saveFailed'));
  });
});
