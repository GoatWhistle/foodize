import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVendorRestaurants } from '../../../../pages/vendor/hooks/useVendorRestaurants';
import { useRestaurantStore } from '@shared/store/useRestaurantStore';
import { vendorService } from '@shared/services/vendorService';
import { restaurantService } from '@shared/services/restaurantService';
import type { Restaurant } from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';
import {
  createRestaurant,
  dataResp,
  fetchMenu,
  fetchMyRestaurants,
  makeParams,
  storeState,
  submitEvent,
} from './vendorRestaurantsHarness';

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

describe('useVendorRestaurants restaurants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vendorService.getMyProfile).mockResolvedValue(dataResp({ approval_status: 'APPROVED' }));
    vi.mocked(restaurantService.getWorkingHours).mockResolvedValue(dataResp([]));
    void useRestaurantStore;
  });

  it('fetches restaurants and profile on mount', async () => {
    const { result } = renderHook(() => useVendorRestaurants(makeParams()));
    await waitFor(() => { expect(result.current.vendorProfile).toEqual({ approval_status: 'APPROVED' }); });
    expect(fetchMyRestaurants).toHaveBeenCalled();
    expect(result.current.restaurants).toHaveLength(1);
  });

  it('logs error when profile fetch fails', async () => {
    vi.mocked(vendorService.getMyProfile).mockRejectedValue(new Error('x'));
    const { logError } = await import('@shared/utils/logError');
    renderHook(() => useVendorRestaurants(makeParams()));
    await waitFor(() => { expect(logError).toHaveBeenCalledWith('useVendorRestaurants.getMyProfile', expect.any(Error)); });
  });

  it('fetches menu when a restaurant is selected', async () => {
    const { result } = renderHook(() => useVendorRestaurants(makeParams()));
    await waitFor(() => { expect(fetchMyRestaurants).toHaveBeenCalled(); });
    act(() => { result.current.setSelectedRestaurant({ id: 'r1' } as Restaurant); });
    await waitFor(() => { expect(fetchMenu).toHaveBeenCalledWith('r1'); });
  });

  it('creates a restaurant and selects it', async () => {
    createRestaurant.mockResolvedValue({ id: 'r2', name: 'New' });
    const params = makeParams();
    const { result } = renderHook(() => useVendorRestaurants(params));
    act(() =>
      { result.current.setNewRestaurant({
        name: 'New',
        address: 'Addr',
        avg_prep_time_minutes: '',
        max_active_orders: '3',
      }); }
    );
    await act(async () => {
      await result.current.handleCreateRestaurant(submitEvent());
    });
    expect(createRestaurant).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New', avg_prep_time_minutes: 15, max_active_orders: 3 })
    );
    expect(result.current.selectedRestaurant).toEqual({ id: 'r2', name: 'New' });
  });

  it('sets error when create fails', async () => {
    createRestaurant.mockRejectedValue(new Error('x'));
    const params = makeParams();
    const { result } = renderHook(() => useVendorRestaurants(params));
    await act(async () => {
      await result.current.handleCreateRestaurant(submitEvent());
    });
    expect(params.setFormError).toHaveBeenCalledWith(t('vendor.settings.errors.createFailed'));
  });

  it('updates a restaurant', async () => {
    vi.mocked(restaurantService.update).mockResolvedValue({} as never);
    const params = makeParams();
    const { result } = renderHook(() => useVendorRestaurants(params));
    act(() => { result.current.setSelectedRestaurant({ id: 'r1', name: 'R1', address: 'A1' } as Restaurant); });
    act(() =>
      { result.current.setEditRestaurant({
        id: 'r1',
        name: 'Updated',
        address: 'New Addr',
        avg_prep_time_minutes: 20,
      } as Restaurant); }
    );
    await act(async () => {
      await result.current.handleUpdateRestaurant(submitEvent());
    });
    expect(restaurantService.update).toHaveBeenCalledWith('r1', expect.objectContaining({ name: 'Updated' }));
    expect(result.current.editRestaurant).toBeNull();
  });

  it('validates missing name on update', async () => {
    const params = makeParams();
    const { result } = renderHook(() => useVendorRestaurants(params));
    act(() => { result.current.setSelectedRestaurant({ id: 'r1', name: 'R1', address: 'A1' } as Restaurant); });
    act(() => { result.current.setEditRestaurant({ id: 'r1', name: '  ', address: 'A' } as Restaurant); });
    await act(async () => {
      await result.current.handleUpdateRestaurant(submitEvent());
    });
    expect(params.setFormError).toHaveBeenCalledWith(t('vendor.settings.errors.nameRequired'));
  });

  it('validates missing address on update', async () => {
    const params = makeParams();
    const { result } = renderHook(() => useVendorRestaurants(params));
    act(() => { result.current.setSelectedRestaurant({ id: 'r1', name: 'R1', address: 'A1' } as Restaurant); });
    act(() => { result.current.setEditRestaurant({ id: 'r1', name: 'N', address: '  ' } as Restaurant); });
    await act(async () => {
      await result.current.handleUpdateRestaurant(submitEvent());
    });
    expect(params.setFormError).toHaveBeenCalledWith(t('vendor.settings.errors.addressRequired'));
  });

  it('returns early on update with no selected restaurant', async () => {
    const params = makeParams();
    const { result } = renderHook(() => useVendorRestaurants(params));
    await act(async () => {
      await result.current.handleUpdateRestaurant(submitEvent());
    });
    expect(restaurantService.update).not.toHaveBeenCalled();
  });

  it('sets error when update fails', async () => {
    vi.mocked(restaurantService.update).mockRejectedValue(new Error('x'));
    const params = makeParams();
    const { result } = renderHook(() => useVendorRestaurants(params));
    act(() => { result.current.setSelectedRestaurant({ id: 'r1', name: 'R1', address: 'A1' } as Restaurant); });
    await act(async () => {
      await result.current.handleUpdateRestaurant(submitEvent());
    });
    expect(params.setFormError).toHaveBeenCalledWith(t('vendor.settings.errors.updateFailed'));
  });
});
