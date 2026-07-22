import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdminDashboard } from '../../../pages/admin/useAdminDashboard';
import { t } from '@shared/i18n/useTranslation';

vi.mock('../../../services/adminService', () => ({
  adminService: {
    getPlatformStats: vi.fn(),
  },
}));

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({ user: { id: 'admin-1', name: 'Admin' } })),
}));

vi.mock('../../../utils/download', () => ({ downloadBlob: vi.fn() }));

const capturedSetActionSuccess = vi.hoisted(() => ({ fn: null as ((m: string) => void) | null }));

vi.mock('../../../pages/admin/hooks/useAdminUsers', () => ({
  useAdminUsers: () => ({ batchUsersLoading: false }),
  PAGE_SIZE: 20,
}));
vi.mock('../../../pages/admin/hooks/useAdminRestaurants', () => ({
  useAdminRestaurants: () => ({ batchRestaurantsLoading: false }),
}));
vi.mock('../../../pages/admin/hooks/useAdminVendors', () => ({
  useAdminVendors: () => ({ batchVendorsLoading: false }),
}));
vi.mock('../../../pages/admin/hooks/useAdminOrders', () => ({
  useAdminOrders: () => ({}),
}));
vi.mock('../../../pages/admin/hooks/useAdminReviews', () => ({
  useAdminReviews: (args: { setActionSuccess: (m: string) => void }) => {
    capturedSetActionSuccess.fn = args.setActionSuccess;
    return { batchReviewsLoading: false };
  },
}));
vi.mock('../../../pages/admin/hooks/useAdminFinance', () => ({
  useAdminFinance: () => ({}),
}));
vi.mock('../../../pages/admin/hooks/useAdminAudit', () => ({
  useAdminAudit: () => ({}),
}));

const { adminService } = await import('../../../services/adminService');
const { downloadBlob } = await import('../../../utils/download');

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  vi.mocked(adminService.getPlatformStats).mockResolvedValue(
    { orders_by_status: { PENDING: 3, COMPLETED: 7 } } as unknown as Awaited<
      ReturnType<typeof adminService.getPlatformStats>
    >
  );
});

describe('useAdminDashboard', () => {
  it('loads stats on mount and builds chart data', async () => {
    const { result } = renderHook(() => useAdminDashboard());
    await waitFor(() => {
      expect(adminService.getPlatformStats).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(result.current.ordersByStatusChartData).not.toBeNull();
    });
    expect(Object.values(result.current.ordersByStatusChartData ?? {})).toContain(3);
    expect(result.current.currentUser).toEqual({ id: 'admin-1', name: 'Admin' });
    expect(result.current.todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('sets an error when stats loading fails', async () => {
    vi.mocked(adminService.getPlatformStats).mockRejectedValueOnce(new Error('nope'));
    const { result } = renderHook(() => useAdminDashboard());
    await waitFor(() => {
      expect(result.current.actionError).toBe(t('admin.errors.statsLoadFailed'));
    });
  });

  it('returns null chart data when stats lack orders_by_status', async () => {
    vi.mocked(adminService.getPlatformStats).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof adminService.getPlatformStats>>
    );
    const { result } = renderHook(() => useAdminDashboard());
    await waitFor(() => { expect(result.current.stats).not.toBeNull(); });
    expect(result.current.ordersByStatusChartData).toBeNull();
  });

  it('exports a blob via handleExport and downloads it', async () => {
    const { result } = renderHook(() => useAdminDashboard());
    const blob = new Blob(['x']);
    const exportFn = vi.fn().mockResolvedValue(blob);
    await act(async () => {
      await result.current.handleExport(exportFn, 'file.csv');
    });
    expect(exportFn).toHaveBeenCalled();
    expect(downloadBlob).toHaveBeenCalledWith(blob, 'file.csv');
    expect(result.current.exportLoading).toBe(false);
  });

  it('sets an error when export fails', async () => {
    const { result } = renderHook(() => useAdminDashboard());
    await act(async () => {
      await result.current.handleExport(vi.fn().mockRejectedValue(new Error('x')), 'file.csv');
    });
    expect(result.current.actionError).toBe(t('admin.errors.exportFailed'));
  });

  it('requestReason opens the dialog and runReasonAction runs onConfirm', async () => {
    const { result } = renderHook(() => useAdminDashboard());
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    act(() => {
      result.current.requestReason({ title: 'T', confirmLabel: 'OK', onConfirm });
    });
    expect(result.current.reasonDialog).toMatchObject({ title: 'T' });
    await act(async () => {
      await result.current.runReasonAction('reason text');
    });
    expect(onConfirm).toHaveBeenCalledWith('reason text');
    expect(result.current.reasonDialog).toBeNull();
    expect(result.current.reasonLoading).toBe(false);
  });

  it('runReasonAction is a no-op without a dialog', async () => {
    const { result } = renderHook(() => useAdminDashboard());
    await act(async () => {
      await result.current.runReasonAction('x');
    });
    expect(result.current.reasonDialog).toBeNull();
  });

  it('clears banners when the active tab changes', async () => {
    vi.mocked(adminService.getPlatformStats).mockRejectedValueOnce(new Error('nope'));
    const { result } = renderHook(() => useAdminDashboard());
    await waitFor(() => { expect(result.current.actionError).toBeTruthy(); });
    act(() => { result.current.setActiveTab('users'); });
    await waitFor(() => { expect(result.current.actionError).toBe(''); });
  });

  it('opens entities section when switching to an entity tab', () => {
    const { result } = renderHook(() => useAdminDashboard());
    act(() => { result.current.setEntitiesOpen(false); });
    act(() => { result.current.setActiveTab('vendors'); });
    expect(result.current.entitiesOpen).toBe(true);
  });

  it('toggles qr restaurant state', () => {
    const { result } = renderHook(() => useAdminDashboard());
    act(() => {
      result.current.setQrRestaurant({ id: 'r1', name: 'R' } as never);
      result.current.setQrType('telegram');
    });
    expect(result.current.qrRestaurant).toMatchObject({ id: 'r1' });
    expect(result.current.qrType).toBe('telegram');
  });

  it('shows and auto-clears the success toast after its duration', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useAdminDashboard());
    expect(capturedSetActionSuccess.fn).toBeTruthy();
    act(() => { capturedSetActionSuccess.fn?.('Сохранено'); });
    expect(result.current.actionSuccess).toBe('Сохранено');
    act(() => { capturedSetActionSuccess.fn?.('Снова'); });
    expect(result.current.actionSuccess).toBe('Снова');
    act(() => { vi.advanceTimersByTime(4000); });
    expect(result.current.actionSuccess).toBe('');
    unmount();
    vi.useRealTimers();
  });
});
