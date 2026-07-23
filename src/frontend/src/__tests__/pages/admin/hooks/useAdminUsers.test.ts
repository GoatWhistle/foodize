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

describe('useAdminUsers loading and details', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmState.last = null;
  });

  it('skips other tabs', () => {
    renderHook(() => useAdminUsers({ ...baseArgs(), activeTab: 'reviews' }));
    expect(adminService.getUsers).not.toHaveBeenCalled();
  });

  it('loads users and applies role filter', async () => {
    okUsers(adminService);
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
    okUsers(adminService);
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
    okUsers(adminService);
    vi.mocked(adminService.getUser).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    await act(async () => {
      await result.current.loadUserDetails('u1');
    });
    expect(setActionError).toHaveBeenCalledWith(t('admin.users.errors.detailsFailed'));
  });

  it('exposes page and search setters', () => {
    okUsers(adminService);
    const { result } = renderHook(() => useAdminUsers(baseArgs()));
    act(() => {
      result.current.setUsersPage(2);
      result.current.setUserSearchRaw('abc');
    });
    expect(result.current.usersPage).toBe(2);
    expect(result.current.userSearchRaw).toBe('abc');
  });
});
