import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAdminUsers } from '../../../../pages/admin/hooks/useAdminUsers';
import { t } from '@shared/i18n/useTranslation';
import {
  baseArgs,
  confirmState,
  okUsers,
  requestConfirm,
  setActionError,
  setActionSuccess,
  setPermissionActionLoading,
} from './adminUsersHarness';

vi.mock('../../../../services/adminService', () => ({
  adminService: {
    getUsers: vi.fn(),
    getUser: vi.fn(),
    deleteUser: vi.fn(),
    activateUser: vi.fn(),
    grantAdmin: vi.fn(),
    setPermissions: vi.fn(),
    batchActivateUsers: vi.fn(),
    batchDeactivateUsers: vi.fn(),
  },
}));

vi.mock('@shared/store/useModalStore', () => ({
  useModalStore: vi.fn((sel?: (s: { requestConfirm: typeof requestConfirm }) => unknown) => {
    const state = { requestConfirm };
    return sel ? sel(state) : state;
  }),
}));

const { adminService } = await import('../../../../services/adminService');

describe('useAdminUsers actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmState.last = null;
  });

  it('deletes (blocks) a user on confirm', async () => {
    okUsers(adminService);
    vi.mocked(adminService.deleteUser).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.handleDeleteUser('u1'); });
    await act(async () => {
      await confirmState.last?.onConfirm?.();
    });
    expect(adminService.deleteUser).toHaveBeenCalledWith('u1');
    await waitFor(() =>
      { expect(result.current.users.find((u) => u.id === 'u1')?.is_active).toBe(false); },
    );
  });

  it('reports delete failure', async () => {
    okUsers(adminService);
    vi.mocked(adminService.deleteUser).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.handleDeleteUser('u1'); });
    await act(async () => {
      await confirmState.last?.onConfirm?.();
    });
    expect(setActionError).toHaveBeenCalledWith(t('admin.users.errors.blockFailed'));
  });

  it('activates a user', async () => {
    okUsers(adminService);
    vi.mocked(adminService.activateUser).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    await act(async () => {
      await result.current.handleActivateUser('u2');
    });
    expect(adminService.activateUser).toHaveBeenCalledWith('u2');
    expect(result.current.users.find((u) => u.id === 'u2')?.is_active).toBe(true);
    expect(setPermissionActionLoading).toHaveBeenCalledWith(true);
  });

  it('reports activate failure', async () => {
    okUsers(adminService);
    vi.mocked(adminService.activateUser).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await act(async () => {
      await result.current.handleActivateUser('u2');
    });
    expect(setActionError).toHaveBeenCalledWith(t('admin.users.errors.unblockFailed'));
  });

  it('makes a user admin on confirm', async () => {
    okUsers(adminService);
    vi.mocked(adminService.grantAdmin).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.handleMakeAdmin('u1'); });
    await act(async () => {
      await confirmState.last?.onConfirm?.();
    });
    expect(adminService.grantAdmin).toHaveBeenCalledWith('u1');
  });

  it('reports make-admin failure', async () => {
    okUsers(adminService);
    vi.mocked(adminService.grantAdmin).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.handleMakeAdmin('u1'); });
    await act(async () => {
      await confirmState.last?.onConfirm?.();
    });
    expect(setActionError).toHaveBeenCalledWith(t('admin.users.errors.roleChangeFailed'));
  });

  it('sets a permission preset on confirm', async () => {
    okUsers(adminService);
    vi.mocked(adminService.setPermissions).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.handleSetPermissionPreset('u1', 'VENDOR'); });
    await act(async () => {
      await confirmState.last?.onConfirm?.();
    });
    expect(adminService.setPermissions).toHaveBeenCalledWith('u1', expect.any(Array));
  });

  it('reports preset failure', async () => {
    okUsers(adminService);
    vi.mocked(adminService.setPermissions).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.handleSetPermissionPreset('u1', 'STAFF'); });
    await act(async () => {
      await confirmState.last?.onConfirm?.();
    });
    expect(setActionError).toHaveBeenCalledWith(t('admin.users.errors.roleChangeFailed'));
  });

  it('batch activates directly without confirm', async () => {
    okUsers(adminService);
    vi.mocked(adminService.batchActivateUsers).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.setSelectedUserIds(new Set(['u1', 'u2'])); });
    await act(async () => {
      result.current.handleBatchUsers('activate');
      await Promise.resolve();
    });
    await waitFor(() => { expect(adminService.batchActivateUsers).toHaveBeenCalledWith(['u1', 'u2']); });
    expect(setActionSuccess).toHaveBeenCalledWith(t('admin.users.messages.batchDone', { count: 2 }));
  });

  it('batch deactivates via confirm', async () => {
    okUsers(adminService);
    vi.mocked(adminService.batchDeactivateUsers).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.setSelectedUserIds(new Set(['u1'])); });
    act(() => { result.current.handleBatchUsers('deactivate'); });
    await act(async () => {
      await confirmState.last?.onConfirm?.();
    });
    expect(adminService.batchDeactivateUsers).toHaveBeenCalledWith(['u1']);
  });

  it('reports batch failure', async () => {
    okUsers(adminService);
    vi.mocked(adminService.batchActivateUsers).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.setSelectedUserIds(new Set(['u1'])); });
    await act(async () => {
      result.current.handleBatchUsers('activate');
      await Promise.resolve();
    });
    await waitFor(() =>
      { expect(setActionError).toHaveBeenCalledWith(t('admin.users.errors.batchFailed')); },
    );
  });
});
