import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAdminReviews } from '../../../../pages/admin/hooks/useAdminReviews';
import type { ConfirmDialogConfig } from '@shared/store/useModalStore';

vi.mock('../../../../services/adminService', () => ({
  adminService: {
    getReviews: vi.fn(),
    deleteReview: vi.fn(),
    batchDeleteReviews: vi.fn(),
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

const baseArgs = () => ({ activeTab: 'reviews', setActionError, setActionSuccess });

const okReviews = () =>
  vi.mocked(adminService.getReviews).mockResolvedValue({
    items: [
      { id: 'r1', rating: 5 },
      { id: 'r2', rating: 3 },
    ],
    total: 2,
  } as unknown as Awaited<ReturnType<typeof adminService.getReviews>>);

describe('useAdminReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastConfirm = null;
  });

  it('skips loading for other tabs', () => {
    renderHook(() => useAdminReviews({ ...baseArgs(), activeTab: 'users' }));
    expect(adminService.getReviews).not.toHaveBeenCalled();
  });

  it('loads reviews with rating filter', async () => {
    okReviews();
    const { result } = renderHook(() => useAdminReviews(baseArgs()));
    await waitFor(() => { expect(result.current.reviews).toHaveLength(2); });
    expect(result.current.reviewsTotal).toBe(2);
    act(() => { result.current.setReviewFilters({ rating: '5' }); });
    await waitFor(() =>
      { expect(adminService.getReviews).toHaveBeenLastCalledWith(
        expect.objectContaining({ rating: '5' }),
      ); },
    );
  });

  it('handles load error', async () => {
    vi.mocked(adminService.getReviews).mockRejectedValue(new Error('x'));
    renderHook(() => useAdminReviews(baseArgs()));
    await waitFor(() => { expect(setActionError).toHaveBeenCalledWith('Не удалось загрузить отзывы'); });
  });

  it('deletes a single review on confirm', async () => {
    okReviews();
    vi.mocked(adminService.deleteReview).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminReviews(baseArgs()));
    await waitFor(() => { expect(result.current.reviews).toHaveLength(2); });
    act(() => { result.current.handleDeleteReview('r1'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(adminService.deleteReview).toHaveBeenCalledWith('r1');
    await waitFor(() => { expect(result.current.reviews.map((r) => r.id)).toEqual(['r2']); });
    expect(result.current.reviewsTotal).toBe(1);
  });

  it('reports delete failure', async () => {
    okReviews();
    vi.mocked(adminService.deleteReview).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminReviews(baseArgs()));
    await waitFor(() => { expect(result.current.reviews).toHaveLength(2); });
    act(() => { result.current.handleDeleteReview('r1'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(setActionError).toHaveBeenCalledWith('Не удалось удалить отзыв');
  });

  it('batch deletes selected reviews', async () => {
    okReviews();
    vi.mocked(adminService.batchDeleteReviews).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminReviews(baseArgs()));
    await waitFor(() => { expect(result.current.reviews).toHaveLength(2); });
    act(() => { result.current.setSelectedReviewIds(new Set(['r1', 'r2'])); });
    act(() => { result.current.handleBatchDeleteReviews(); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(adminService.batchDeleteReviews).toHaveBeenCalledWith(['r1', 'r2']);
    expect(setActionSuccess).toHaveBeenCalledWith('Удалено: 2 отзывов');
    expect(result.current.selectedReviewIds.size).toBe(0);
  });

  it('reports batch delete failure', async () => {
    okReviews();
    vi.mocked(adminService.batchDeleteReviews).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminReviews(baseArgs()));
    await waitFor(() => { expect(result.current.reviews).toHaveLength(2); });
    act(() => { result.current.setSelectedReviewIds(new Set(['r1'])); });
    act(() => { result.current.handleBatchDeleteReviews(); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(setActionError).toHaveBeenCalledWith('Ошибка при удалении');
    expect(result.current.batchReviewsLoading).toBe(false);
  });

  it('exposes page control', () => {
    okReviews();
    const { result } = renderHook(() => useAdminReviews(baseArgs()));
    act(() => { result.current.setReviewsPage(2); });
    expect(result.current.reviewsPage).toBe(2);
  });
});
