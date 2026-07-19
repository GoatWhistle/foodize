import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVendorStaff } from '../../../../pages/vendor/hooks/useVendorStaff';
import { vendorService } from '@shared/services/vendorService';
import { at } from '../../../testUtils';

vi.mock('@shared/services/vendorService', () => ({
  vendorService: {
    getStaffRequests: vi.fn(),
    getStaffMembers: vi.fn(),
    updateStaffStatus: vi.fn(),
    removeStaffMember: vi.fn(),
  },
}));

vi.mock('@shared/utils/logError', () => ({ logError: vi.fn() }));

const resp = (items: unknown[], total?: number) =>
  ({ data: { data: items, ...(total != null ? { pagination: { total } } : {}) } }) as never;

describe('useVendorStaff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vendorService.getStaffRequests).mockResolvedValue(resp([{ id: 'req1', status: 'PENDING', user_id: 'u1' }], 1));
    vi.mocked(vendorService.getStaffMembers).mockResolvedValue(resp([{ id: 'm1', user_id: 'u2' }], 1));
  });

  it('loads requests and members on mount', async () => {
    const { result } = renderHook(() => useVendorStaff());
    await waitFor(() => {
      expect(result.current.staffRequests).toHaveLength(1);
      expect(result.current.staffMembers).toHaveLength(1);
    });
    expect(result.current.staffTotal).toBe(1);
    expect(result.current.staffMembersTotal).toBe(1);
  });

  it('handles non-array responses and missing pagination', async () => {
    vi.mocked(vendorService.getStaffRequests).mockResolvedValue(resp(null as never));
    vi.mocked(vendorService.getStaffMembers).mockResolvedValue(resp([{ id: 'm1', user_id: 'u2' }]));
    const { result } = renderHook(() => useVendorStaff());
    await waitFor(() => { expect(result.current.staffMembers).toHaveLength(1); });
    expect(result.current.staffRequests).toEqual([]);
    expect(result.current.staffMembersTotal).toBe(1);
  });

  it('logs errors when loading fails', async () => {
    vi.mocked(vendorService.getStaffRequests).mockRejectedValue(new Error('x'));
    vi.mocked(vendorService.getStaffMembers).mockRejectedValue(new Error('y'));
    const { logError } = await import('@shared/utils/logError');
    renderHook(() => useVendorStaff());
    await waitFor(() => { expect(logError).toHaveBeenCalled(); });
  });

  it('accepts a request and refreshes members', async () => {
    vi.mocked(vendorService.updateStaffStatus).mockResolvedValue({} as never);
    const { result } = renderHook(() => useVendorStaff());
    await waitFor(() => { expect(result.current.staffRequests).toHaveLength(1); });
    vi.mocked(vendorService.getStaffMembers).mockResolvedValue(resp([{ id: 'm1', user_id: 'u2' }, { id: 'm2', user_id: 'u3' }], 2));
    await act(async () => {
      await result.current.handleStaffDecision('req1', 'ACCEPTED');
    });
    expect(at(result.current.staffRequests, 0).status).toBe('ACCEPTED');
    expect(result.current.staffMembers).toHaveLength(2);
  });

  it('rejects a request without refreshing members', async () => {
    vi.mocked(vendorService.updateStaffStatus).mockResolvedValue({} as never);
    const { result } = renderHook(() => useVendorStaff());
    await waitFor(() => { expect(result.current.staffRequests).toHaveLength(1); });
    vi.mocked(vendorService.getStaffMembers).mockClear();
    await act(async () => {
      await result.current.handleStaffDecision('req1', 'REJECTED');
    });
    expect(at(result.current.staffRequests, 0).status).toBe('REJECTED');
    expect(vendorService.getStaffMembers).not.toHaveBeenCalled();
  });

  it('logs error and clears loading when decision fails', async () => {
    vi.mocked(vendorService.updateStaffStatus).mockRejectedValue(new Error('bad'));
    const { logError } = await import('@shared/utils/logError');
    const { result } = renderHook(() => useVendorStaff());
    await waitFor(() => { expect(result.current.staffRequests).toHaveLength(1); });
    await act(async () => {
      await result.current.handleStaffDecision('req1', 'ACCEPTED');
    });
    expect(logError).toHaveBeenCalled();
    expect(result.current.staffDecisionLoading).toBeNull();
  });

  it('logs error when members refresh fails after accept', async () => {
    vi.mocked(vendorService.updateStaffStatus).mockResolvedValue({} as never);
    const { logError } = await import('@shared/utils/logError');
    const { result } = renderHook(() => useVendorStaff());
    await waitFor(() => { expect(result.current.staffRequests).toHaveLength(1); });
    vi.mocked(vendorService.getStaffMembers).mockRejectedValueOnce(new Error('refresh fail'));
    await act(async () => {
      await result.current.handleStaffDecision('req1', 'ACCEPTED');
    });
    expect(logError).toHaveBeenCalledWith('useVendorStaff.refreshMembers', expect.any(Error));
  });

  it('removes a staff member when confirmed', async () => {
    window.confirm = vi.fn(() => true);
    vi.mocked(vendorService.removeStaffMember).mockResolvedValue({} as never);
    const { result } = renderHook(() => useVendorStaff());
    await waitFor(() => { expect(result.current.staffMembers).toHaveLength(1); });
    await act(async () => {
      await result.current.handleRemoveStaffMember('m1');
    });
    expect(result.current.staffMembers).toHaveLength(0);
    expect(result.current.staffMembersTotal).toBe(0);
  });

  it('does not remove when confirm is cancelled', async () => {
    window.confirm = vi.fn(() => false);
    const { result } = renderHook(() => useVendorStaff());
    await waitFor(() => { expect(result.current.staffMembers).toHaveLength(1); });
    await act(async () => {
      await result.current.handleRemoveStaffMember('m1');
    });
    expect(vendorService.removeStaffMember).not.toHaveBeenCalled();
  });

  it('logs error when removal fails', async () => {
    window.confirm = vi.fn(() => true);
    vi.mocked(vendorService.removeStaffMember).mockRejectedValue(new Error('nope'));
    const { logError } = await import('@shared/utils/logError');
    const { result } = renderHook(() => useVendorStaff());
    await waitFor(() => { expect(result.current.staffMembers).toHaveLength(1); });
    await act(async () => {
      await result.current.handleRemoveStaffMember('m1');
    });
    expect(logError).toHaveBeenCalledWith('useVendorStaff.handleRemoveStaffMember', expect.any(Error));
  });

  it('exposes sub-tab and page setters', () => {
    const { result } = renderHook(() => useVendorStaff());
    act(() => {
      result.current.setStaffSubTab('requests');
      result.current.setStaffPage(2);
      result.current.setStaffMembersPage(3);
    });
    expect(result.current.staffSubTab).toBe('requests');
    expect(result.current.staffPage).toBe(2);
    expect(result.current.staffMembersPage).toBe(3);
  });
});
