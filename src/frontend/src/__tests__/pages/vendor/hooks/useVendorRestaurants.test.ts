import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVendorRestaurants } from '../../../../pages/vendor/hooks/useVendorRestaurants';
import { useRestaurantStore } from '@shared/store/useRestaurantStore';
import { vendorService } from '@shared/services/vendorService';
import { restaurantService } from '@shared/services/restaurantService';
import type { Restaurant } from '@shared/types/models';
import { at } from '../../../testUtils';

const fetchMyRestaurants = vi.fn(() => Promise.resolve(undefined));
const fetchMenu = vi.fn(() => Promise.resolve(undefined));
const addMenuItem = vi.fn();
const createRestaurant = vi.fn();

const storeState = {
  restaurants: [{ id: 'r1', name: 'R1', address: 'A1' }] as unknown as Restaurant[],
  fetchMyRestaurants,
  fetchMenu,
  myLoading: false,
  addMenuItem,
  menus: { r1: [] },
  createRestaurant,
};

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

const dataResp = (data: unknown) => ({ data: { data } }) as never;
const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as React.FormEvent<HTMLFormElement>;

const makeParams = (activeTab = 'menu') => ({
  activeTab,
  setFormLoading: vi.fn(),
  setFormError: vi.fn(),
});

describe('useVendorRestaurants', () => {
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
    expect(params.setFormError).toHaveBeenCalledWith('Ошибка создания');
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
    expect(params.setFormError).toHaveBeenCalledWith('Укажите название заведения');
  });

  it('validates missing address on update', async () => {
    const params = makeParams();
    const { result } = renderHook(() => useVendorRestaurants(params));
    act(() => { result.current.setSelectedRestaurant({ id: 'r1', name: 'R1', address: 'A1' } as Restaurant); });
    act(() => { result.current.setEditRestaurant({ id: 'r1', name: 'N', address: '  ' } as Restaurant); });
    await act(async () => {
      await result.current.handleUpdateRestaurant(submitEvent());
    });
    expect(params.setFormError).toHaveBeenCalledWith('Укажите адрес заведения');
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
    expect(params.setFormError).toHaveBeenCalledWith('Ошибка обновления');
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
    await waitFor(() => { expect(result.current.workingHoursError).toBe('Не удалось загрузить расписание'); });
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
    expect(result.current.workingHoursError).toBe('Не удалось сохранить расписание');
  });
});
