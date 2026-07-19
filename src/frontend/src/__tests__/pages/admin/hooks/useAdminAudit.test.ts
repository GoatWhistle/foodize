import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAdminAudit } from '../../../../pages/admin/hooks/useAdminAudit';

vi.mock('../../../../services/adminService', () => ({
  adminService: {
    getAuditLogs: vi.fn(),
  },
}));

const { adminService } = await import('../../../../services/adminService');

const setActionError = vi.fn();

const baseArgs = () => ({ activeTab: 'audit', setActionError });

describe('useAdminAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when tab is not audit', () => {
    renderHook(() => useAdminAudit({ activeTab: 'users', setActionError }));
    expect(adminService.getAuditLogs).not.toHaveBeenCalled();
  });

  it('loads audit logs on active tab', async () => {
    vi.mocked(adminService.getAuditLogs).mockResolvedValue({
      items: [{ id: 'a1', action: 'DELETE_REVIEW', entity_type: 'review', created_at: 'x' }],
      total: 1,
    });
    const { result } = renderHook(() => useAdminAudit(baseArgs()));
    await waitFor(() => { expect(result.current.auditLogs).toHaveLength(1); });
    expect(result.current.auditTotal).toBe(1);
    expect(result.current.auditLoading).toBe(false);
  });

  it('applies filters into request params', async () => {
    vi.mocked(adminService.getAuditLogs).mockResolvedValue({
      items: [],
      total: 0,
    });
    const { result } = renderHook(() => useAdminAudit(baseArgs()));
    await waitFor(() => { expect(adminService.getAuditLogs).toHaveBeenCalled(); });
    act(() => {
      result.current.setAuditFilters({
        action: 'APPROVE_VENDOR',
        entity_type: 'vendor',
        date_from: '2026-01-01',
        date_to: '2026-02-01',
      });
    });
    await waitFor(() =>
      { expect(adminService.getAuditLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: 'APPROVE_VENDOR',
          entity_type: 'vendor',
          date_from: '2026-01-01',
          date_to: '2026-02-01',
        }),
      ); },
    );
  });

  it('sets error on failure', async () => {
    vi.mocked(adminService.getAuditLogs).mockRejectedValue(new Error('boom'));
    renderHook(() => useAdminAudit(baseArgs()));
    await waitFor(() => { expect(setActionError).toHaveBeenCalledWith('Не удалось загрузить логи'); });
  });

  it('exposes page and expanded controls', () => {
    vi.mocked(adminService.getAuditLogs).mockResolvedValue({
      items: [],
      total: 0,
    });
    const { result } = renderHook(() => useAdminAudit(baseArgs()));
    act(() => {
      result.current.setAuditPage(3);
      result.current.setExpandedAuditId('a1');
    });
    expect(result.current.auditPage).toBe(3);
    expect(result.current.expandedAuditId).toBe('a1');
  });
});
