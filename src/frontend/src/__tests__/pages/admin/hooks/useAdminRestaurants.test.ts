import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAdminRestaurants } from '../../../../pages/admin/hooks/useAdminRestaurants';
import type { ConfirmDialogConfig } from '@shared/store/useModalStore';
import type { ReasonDialogConfig } from '../../../../pages/admin/useAdminDashboard';

vi.mock('../../../../services/adminService', () => ({
  adminService: {
    getRestaurants: vi.fn(),
    getRestaurant: vi.fn(),
    deleteRestaurant: vi.fn(),
    approveRestaurant: vi.fn(),
    rejectRestaurant: vi.fn(),
    batchApproveRestaurants: vi.fn(),
    batchRejectRestaurants: vi.fn(),
  },
}));

let lastConfirm: ConfirmDialogConfig | null = null;
const requestConfirm = vi.fn((cfg: ConfirmDialogConfig) => {
  lastConfirm = cfg;
});

vi.mock('@shared/store/useModalStore', () => ({
  useModalStore: vi.fn((sel?: (s: { requestConfirm: typeof requestConfirm }) => unknown) => {
    const state = { requestConfirm };
    return sel ? sel(state) : state;
  }),
}));

const { adminService } = await import('../../../../services/adminService');

const setActionError = vi.fn();
const setActionSuccess = vi.fn();
const setStats = vi.fn();

let lastReason: ReasonDialogConfig | null = null;
const requestReason = vi.fn((cfg: ReasonDialogConfig) => {
  lastReason = cfg;
});

const baseArgs = () => ({
  activeTab: 'restaurants',
  setActionError,
  setActionSuccess,
  setStats,
  requestReason,
});

const okRestaurants = () =>
  vi.mocked(adminService.getRestaurants).mockResolvedValue({
    items: [
      { id: 'r1', moderation_status: 'PENDING' },
      { id: 'r2', moderation_status: 'APPROVED' },
    ],
    total: 2,
  } as unknown as Awaited<ReturnType<typeof adminService.getRestaurants>>);

describe('useAdminRestaurants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastConfirm = null;
    lastReason = null;
  });

  it('skips other tabs', () => {
    renderHook(() => useAdminRestaurants({ ...baseArgs(), activeTab: 'users' }));
    expect(adminService.getRestaurants).not.toHaveBeenCalled();
  });

  it('loads restaurants and applies filters', async () => {
    okRestaurants();
    const { result } = renderHook(() => useAdminRestaurants(baseArgs()));
    await waitFor(() => { expect(result.current.restaurants).toHaveLength(2); });
    expect(result.current.restaurantsTotal).toBe(2);
    act(() =>
      { result.current.setRestaurantFilters({
        is_open: 'true',
        moderation_status: 'PENDING',
        min_rating: '4',
      }); },
    );
    await waitFor(() =>
      { expect(adminService.getRestaurants).toHaveBeenLastCalledWith(
        expect.objectContaining({ is_open: 'true', moderation_status: 'PENDING', min_rating: '4' }),
      ); },
    );
  });

  it('handles load error', async () => {
    vi.mocked(adminService.getRestaurants).mockRejectedValue(new Error('x'));
    renderHook(() => useAdminRestaurants(baseArgs()));
    await waitFor(() =>
      { expect(setActionError).toHaveBeenCalledWith('Не удалось загрузить рестораны'); },
    );
  });

  it('loads details success and failure', async () => {
    okRestaurants();
    vi.mocked(adminService.getRestaurant).mockResolvedValueOnce({ id: 'r1' } as unknown as Awaited<
      ReturnType<typeof adminService.getRestaurant>
    >);
    const { result } = renderHook(() => useAdminRestaurants(baseArgs()));
    await act(async () => {
      await result.current.loadRestaurantDetails('r1');
    });
    expect(result.current.selectedRestaurant).toEqual({ id: 'r1' });
    vi.mocked(adminService.getRestaurant).mockRejectedValueOnce(new Error('x'));
    await act(async () => {
      await result.current.loadRestaurantDetails('r1');
    });
    expect(setActionError).toHaveBeenCalledWith('Не удалось загрузить детали ресторана');
  });

  it('deletes restaurant on confirm', async () => {
    okRestaurants();
    vi.mocked(adminService.deleteRestaurant).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminRestaurants(baseArgs()));
    await waitFor(() => { expect(result.current.restaurants).toHaveLength(2); });
    act(() => { result.current.handleDeleteRestaurant('r1'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(adminService.deleteRestaurant).toHaveBeenCalledWith('r1');
    expect(setStats).toHaveBeenCalledWith(null);
    await waitFor(() => { expect(result.current.restaurants.map((r) => r.id)).toEqual(['r2']); });
  });

  it('reports delete failure', async () => {
    okRestaurants();
    vi.mocked(adminService.deleteRestaurant).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminRestaurants(baseArgs()));
    await waitFor(() => { expect(result.current.restaurants).toHaveLength(2); });
    act(() => { result.current.handleDeleteRestaurant('r1'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(setActionError).toHaveBeenCalledWith('Не удалось удалить ресторан');
  });

  it('approves restaurant directly', async () => {
    okRestaurants();
    vi.mocked(adminService.approveRestaurant).mockResolvedValue({
      id: 'r1',
      moderation_status: 'APPROVED',
    } as unknown as Awaited<ReturnType<typeof adminService.approveRestaurant>>);
    const { result } = renderHook(() => useAdminRestaurants(baseArgs()));
    await waitFor(() => { expect(result.current.restaurants).toHaveLength(2); });
    await act(async () => {
      await result.current.handleApproveRestaurant('r1');
    });
    expect(setActionSuccess).toHaveBeenCalledWith('Ресторан одобрен');
    expect(result.current.selectedRestaurant?.moderation_status).toBe('APPROVED');
  });

  it('reports approve failure', async () => {
    okRestaurants();
    vi.mocked(adminService.approveRestaurant).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminRestaurants(baseArgs()));
    await waitFor(() => { expect(result.current.restaurants).toHaveLength(2); });
    await act(async () => {
      await result.current.handleApproveRestaurant('r1');
    });
    expect(setActionError).toHaveBeenCalledWith('Не удалось одобрить ресторан');
  });

  it('rejects restaurant with reason', async () => {
    okRestaurants();
    vi.mocked(adminService.rejectRestaurant).mockResolvedValue({
      id: 'r1',
    } as unknown as Awaited<ReturnType<typeof adminService.rejectRestaurant>>);
    const { result } = renderHook(() => useAdminRestaurants(baseArgs()));
    await waitFor(() => { expect(result.current.restaurants).toHaveLength(2); });
    act(() => { result.current.handleRejectRestaurant('r1'); });
    await act(async () => {
      await lastReason?.onConfirm('bad photos');
    });
    expect(adminService.rejectRestaurant).toHaveBeenCalledWith('r1', 'bad photos');
    expect(setActionSuccess).toHaveBeenCalledWith('Ресторан отклонён');
  });

  it('reports reject failure', async () => {
    okRestaurants();
    vi.mocked(adminService.rejectRestaurant).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminRestaurants(baseArgs()));
    await waitFor(() => { expect(result.current.restaurants).toHaveLength(2); });
    act(() => { result.current.handleRejectRestaurant('r1'); });
    await act(async () => {
      await lastReason?.onConfirm('bad');
    });
    expect(setActionError).toHaveBeenCalledWith('Не удалось отклонить ресторан');
  });

  it('batch approves', async () => {
    okRestaurants();
    vi.mocked(adminService.batchApproveRestaurants).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminRestaurants(baseArgs()));
    await waitFor(() => { expect(result.current.restaurants).toHaveLength(2); });
    act(() => { result.current.setSelectedRestaurantIds(new Set(['r1', 'r2'])); });
    await act(async () => {
      await result.current.handleBatchRestaurants('approve');
    });
    expect(adminService.batchApproveRestaurants).toHaveBeenCalledWith(['r1', 'r2']);
    expect(setActionSuccess).toHaveBeenCalledWith('Готово: 2 ресторанов');
  });

  it('batch rejects with reason', async () => {
    okRestaurants();
    vi.mocked(adminService.batchRejectRestaurants).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminRestaurants(baseArgs()));
    await waitFor(() => { expect(result.current.restaurants).toHaveLength(2); });
    act(() => { result.current.setSelectedRestaurantIds(new Set(['r1'])); });
    await act(async () => {
      await result.current.handleBatchRestaurants('reject', 'nope');
    });
    expect(adminService.batchRejectRestaurants).toHaveBeenCalledWith(['r1'], 'nope');
  });

  it('reports batch failure', async () => {
    okRestaurants();
    vi.mocked(adminService.batchApproveRestaurants).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminRestaurants(baseArgs()));
    await waitFor(() => { expect(result.current.restaurants).toHaveLength(2); });
    act(() => { result.current.setSelectedRestaurantIds(new Set(['r1'])); });
    await act(async () => {
      await result.current.handleBatchRestaurants('approve');
    });
    expect(setActionError).toHaveBeenCalledWith('Ошибка при массовом действии');
  });

  it('exposes search and page setters', () => {
    okRestaurants();
    const { result } = renderHook(() => useAdminRestaurants(baseArgs()));
    act(() => {
      result.current.setRestaurantsPage(2);
      result.current.setRestaurantSearchRaw('a');
      result.current.setRestaurantVendorSearchRaw('b');
      result.current.setSelectedRestaurant(null);
    });
    expect(result.current.restaurantsPage).toBe(2);
    expect(result.current.restaurantSearchRaw).toBe('a');
    expect(result.current.restaurantVendorSearchRaw).toBe('b');
  });
});
