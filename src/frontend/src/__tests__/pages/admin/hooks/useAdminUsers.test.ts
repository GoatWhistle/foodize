import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAdminUsers } from '../../../../pages/admin/hooks/useAdminUsers';
import type { ConfirmDialogConfig } from '@shared/store/useModalStore';
import { t } from '@shared/i18n/useTranslation';

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
const setPermissionActionLoading = vi.fn();

const baseArgs = () => ({
  activeTab: 'users',
  setActionError,
  setActionSuccess,
  permissionActionLoading: false,
  setPermissionActionLoading,
});

const okUsers = () =>
  vi.mocked(adminService.getUsers).mockResolvedValue({
    items: [
      { id: 'u1', is_active: true, permissions: [] },
      { id: 'u2', is_active: false, permissions: [] },
    ],
    total: 2,
  } as unknown as Awaited<ReturnType<typeof adminService.getUsers>>);

describe('useAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastConfirm = null;
  });

  it('skips other tabs', () => {
    renderHook(() => useAdminUsers({ ...baseArgs(), activeTab: 'reviews' }));
    expect(adminService.getUsers).not.toHaveBeenCalled();
  });

  it('loads users and applies role filter', async () => {
    okUsers();
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    expect(result.current.usersTotal).toBe(2);
    act(() => { result.current.setUserFilters({ role: 'vendor' }); });
    await waitFor(() =>
      { expect(adminService.getUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ role: 'vendor' }),
      ); },
    );
  });

  it('handles load failure', async () => {
    vi.mocked(adminService.getUsers).mockRejectedValue(new Error('x'));
    renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() =>
      { expect(setActionError).toHaveBeenCalledWith(t('admin.users.errors.loadFailed')); },
    );
  });

  it('loads user details (success)', async () => {
    okUsers();
    vi.mocked(adminService.getUser).mockResolvedValue({ id: 'u1' } as unknown as Awaited<
      ReturnType<typeof adminService.getUser>
    >);
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await act(async () => {
      await result.current.loadUserDetails('u1');
    });
    expect(result.current.selectedUser).toEqual({ id: 'u1' });
  });

  it('loads user details (failure)', async () => {
    okUsers();
    vi.mocked(adminService.getUser).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await act(async () => {
      await result.current.loadUserDetails('u1');
    });
    expect(setActionError).toHaveBeenCalledWith(t('admin.users.errors.detailsFailed'));
  });

  it('deletes (blocks) a user on confirm', async () => {
    okUsers();
    vi.mocked(adminService.deleteUser).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.handleDeleteUser('u1'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(adminService.deleteUser).toHaveBeenCalledWith('u1');
    await waitFor(() =>
      { expect(result.current.users.find((u) => u.id === 'u1')?.is_active).toBe(false); },
    );
  });

  it('reports delete failure', async () => {
    okUsers();
    vi.mocked(adminService.deleteUser).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.handleDeleteUser('u1'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(setActionError).toHaveBeenCalledWith(t('admin.users.errors.blockFailed'));
  });

  it('activates a user', async () => {
    okUsers();
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
    okUsers();
    vi.mocked(adminService.activateUser).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await act(async () => {
      await result.current.handleActivateUser('u2');
    });
    expect(setActionError).toHaveBeenCalledWith(t('admin.users.errors.unblockFailed'));
  });

  it('makes a user admin on confirm', async () => {
    okUsers();
    vi.mocked(adminService.grantAdmin).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.handleMakeAdmin('u1'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(adminService.grantAdmin).toHaveBeenCalledWith('u1');
  });

  it('reports make-admin failure', async () => {
    okUsers();
    vi.mocked(adminService.grantAdmin).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.handleMakeAdmin('u1'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(setActionError).toHaveBeenCalledWith(t('admin.users.errors.roleChangeFailed'));
  });

  it('sets a permission preset on confirm', async () => {
    okUsers();
    vi.mocked(adminService.setPermissions).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.handleSetPermissionPreset('u1', 'VENDOR'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(adminService.setPermissions).toHaveBeenCalledWith('u1', expect.any(Array));
  });

  it('reports preset failure', async () => {
    okUsers();
    vi.mocked(adminService.setPermissions).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.handleSetPermissionPreset('u1', 'STAFF'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(setActionError).toHaveBeenCalledWith(t('admin.users.errors.roleChangeFailed'));
  });

  it('batch activates directly without confirm', async () => {
    okUsers();
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
    okUsers();
    vi.mocked(adminService.batchDeactivateUsers).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await waitFor(() => { expect(result.current.users).toHaveLength(2); });
    act(() => { result.current.setSelectedUserIds(new Set(['u1'])); });
    act(() => { result.current.handleBatchUsers('deactivate'); });
    await act(async () => {
      await lastConfirm?.onConfirm?.();
    });
    expect(adminService.batchDeactivateUsers).toHaveBeenCalledWith(['u1']);
  });

  it('reports batch failure', async () => {
    okUsers();
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

  it('exposes page and search setters', () => {
    okUsers();
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    act(() => {
      result.current.setUsersPage(2);
      result.current.setUserSearchRaw('abc');
    });
    expect(result.current.usersPage).toBe(2);
    expect(result.current.userSearchRaw).toBe('abc');
  });
});
