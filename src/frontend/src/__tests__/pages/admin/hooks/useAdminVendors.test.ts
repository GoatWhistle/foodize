import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAdminVendors } from '../../../../pages/admin/hooks/useAdminVendors';
import type { ConfirmDialogConfig } from '@shared/store/useModalStore';
import type { ReasonDialogConfig } from '../../../../pages/admin/useAdminDashboard';

vi.mock('../../../../services/adminService', () => ({
  adminService: {
    getVendors: vi.fn(),
    getVendor: vi.fn(),
    deleteVendor: vi.fn(),
    approveVendor: vi.fn(),
    rejectVendor: vi.fn(),
    batchApproveVendors: vi.fn(),
    batchRejectVendors: vi.fn(),
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
  activeTab: 'vendors',
  setActionError,
  setActionSuccess,
  setStats,
  requestReason,
});

const okVendors = () =>
  vi.mocked(adminService.getVendors).mockResolvedValue({
    items: [
      { id: 'v1', approval_status: 'PENDING' },
      { id: 'v2', approval_status: 'APPROVED' },
    ],
    total: 2,
  } as unknown as Awaited<ReturnType<typeof adminService.getVendors>>);

describe('useAdminVendors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastConfirm = null;
    lastReason = null;
  });

  it('skips other tabs', () => {
    renderHook(() => useAdminVendors({ ...baseArgs(), activeTab: 'users' }));
    expect(adminService.getVendors).not.toHaveBeenCalled();
  });

  it('loads vendors and applies status filter', async () => {
    okVendors();
    const { result } = renderHook(() => useAdminVendors(baseArgs()));
    await waitFor(() => { expect(result.current.vendors).toHaveLength(2); });
    expect(result.current.vendorsTotal).toBe(2);
    act(() => { result.current.setVendorFilters({ approval_status: 'PENDING' }); });
    await waitFor(() =>
      { expect(adminService.getVendors).toHaveBeenLastCalledWith(
        expect.objectContaining({ approval_status: 'PENDING' }),
      ); },
    );
  });

  it('handles load error', async () => {
    vi.mocked(adminService.getVendors).mockRejectedValue(new Error('x'));
    renderHook(() => useAdminVendors(baseArgs()));
    await waitFor(() => { expect(setActionError).toHaveBeenCalledWith('Не удалось загрузить вендоров'); });
  });

  it('loads vendor details success and failure', async () => {
    okVendors();
    vi.mocked(adminService.getVendor).mockResolvedValueOnce({ id: 'v1' } as unknown as Awaited<
      ReturnType<typeof adminService.getVendor>
    >);
    const { result } = renderHook(() => useAdminVendors(baseArgs()));
    await act(async () => {
      await result.current.loadVendorDetails('v1');
    });
    expect(result.current.selectedVendor).toEqual({ id: 'v1' });
    vi.mocked(adminService.getVendor).mockRejectedValueOnce(new Error('x'));
    await act(async () => {
      await result.current.loadVendorDetails('v1');
    });
    expect(setActionError).toHaveBeenCalledWith('Не удалось загрузить детали вендора');
  });

  it('deletes vendor on confirm', async () => {
    okVendors();
    vi.mocked(adminService.deleteVendor).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminVendors(baseArgs()));
    await waitFor(() => { expect(result.current.vendors).toHaveLength(2); });
    act(() => { result.current.handleDeleteVendor('v1'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(adminService.deleteVendor).toHaveBeenCalledWith('v1');
    expect(setStats).toHaveBeenCalledWith(null);
    await waitFor(() => { expect(result.current.vendors.map((v) => v.id)).toEqual(['v2']); });
  });

  it('reports delete failure', async () => {
    okVendors();
    vi.mocked(adminService.deleteVendor).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminVendors(baseArgs()));
    await waitFor(() => { expect(result.current.vendors).toHaveLength(2); });
    act(() => { result.current.handleDeleteVendor('v1'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(setActionError).toHaveBeenCalledWith('Не удалось удалить вендора');
  });

  it('approves vendor on confirm and refreshes list', async () => {
    okVendors();
    vi.mocked(adminService.approveVendor).mockResolvedValue({
      id: 'v1',
      approval_status: 'APPROVED',
    } as unknown as Awaited<ReturnType<typeof adminService.approveVendor>>);
    const { result } = renderHook(() => useAdminVendors(baseArgs()));
    await waitFor(() => { expect(result.current.vendors).toHaveLength(2); });
    act(() => { result.current.handleApproveVendor('v1'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(setActionSuccess).toHaveBeenCalledWith('Вендор одобрен');
    expect(result.current.selectedVendor?.approval_status).toBe('APPROVED');
  });

  it('reports approve failure', async () => {
    okVendors();
    vi.mocked(adminService.approveVendor).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminVendors(baseArgs()));
    await waitFor(() => { expect(result.current.vendors).toHaveLength(2); });
    act(() => { result.current.handleApproveVendor('v1'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(setActionError).toHaveBeenCalledWith('Не удалось одобрить вендора');
  });

  it('rejects vendor with reason', async () => {
    okVendors();
    vi.mocked(adminService.rejectVendor).mockResolvedValue({
      id: 'v1',
    } as unknown as Awaited<ReturnType<typeof adminService.rejectVendor>>);
    const { result } = renderHook(() => useAdminVendors(baseArgs()));
    await waitFor(() => { expect(result.current.vendors).toHaveLength(2); });
    act(() => { result.current.handleRejectVendor('v1'); });
    await act(async () => {
      await lastReason?.onConfirm('spam');
    });
    expect(adminService.rejectVendor).toHaveBeenCalledWith('v1', 'spam');
    expect(setActionSuccess).toHaveBeenCalledWith('Вендор отклонён');
  });

  it('reports reject failure', async () => {
    okVendors();
    vi.mocked(adminService.rejectVendor).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminVendors(baseArgs()));
    await waitFor(() => { expect(result.current.vendors).toHaveLength(2); });
    act(() => { result.current.handleRejectVendor('v1'); });
    await act(async () => {
      await lastReason?.onConfirm('spam');
    });
    expect(setActionError).toHaveBeenCalledWith('Не удалось отклонить вендора');
  });

  it('batch approves and reports success', async () => {
    okVendors();
    vi.mocked(adminService.batchApproveVendors).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminVendors(baseArgs()));
    await waitFor(() => { expect(result.current.vendors).toHaveLength(2); });
    act(() => { result.current.setSelectedVendorIds(new Set(['v1', 'v2'])); });
    await act(async () => {
      await result.current.handleBatchVendors('approve');
    });
    expect(adminService.batchApproveVendors).toHaveBeenCalledWith(['v1', 'v2']);
    expect(setActionSuccess).toHaveBeenCalledWith('Готово: 2 вендоров');
  });

  it('batch rejects with reason', async () => {
    okVendors();
    vi.mocked(adminService.batchRejectVendors).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminVendors(baseArgs()));
    await waitFor(() => { expect(result.current.vendors).toHaveLength(2); });
    act(() => { result.current.setSelectedVendorIds(new Set(['v1'])); });
    await act(async () => {
      await result.current.handleBatchVendors('reject', 'bad');
    });
    expect(adminService.batchRejectVendors).toHaveBeenCalledWith(['v1'], 'bad');
  });

  it('reports batch failure', async () => {
    okVendors();
    vi.mocked(adminService.batchApproveVendors).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminVendors(baseArgs()));
    await waitFor(() => { expect(result.current.vendors).toHaveLength(2); });
    act(() => { result.current.setSelectedVendorIds(new Set(['v1'])); });
    await act(async () => {
      await result.current.handleBatchVendors('approve');
    });
    expect(setActionError).toHaveBeenCalledWith('Ошибка при массовом действии');
  });

  it('exposes page and search setters', () => {
    okVendors();
    const { result } = renderHook(() => useAdminVendors(baseArgs()));
    act(() => {
      result.current.setVendorsPage(3);
      result.current.setVendorSearchRaw('q');
      result.current.setSelectedVendor(null);
    });
    expect(result.current.vendorsPage).toBe(3);
    expect(result.current.vendorSearchRaw).toBe('q');
  });
});
