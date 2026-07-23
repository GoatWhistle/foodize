import { vi } from 'vitest';
import type { ConfirmDialogConfig } from '@shared/store/useModalStore';
import type { adminService as AdminService } from '../../../../services/adminService';

export const confirmState: { last: ConfirmDialogConfig | null } = { last: null };

export const requestConfirm = vi.fn((cfg: ConfirmDialogConfig) => {
  confirmState.last = cfg;
});

export const setActionError = vi.fn();
export const setActionSuccess = vi.fn();
export const setPermissionActionLoading = vi.fn();

export const baseArgs = () => ({
  activeTab: 'users',
  setActionError,
  setActionSuccess,
  permissionActionLoading: false,
  setPermissionActionLoading,
});

export const okUsers = (adminService: typeof AdminService) =>
  vi.mocked(adminService.getUsers).mockResolvedValue({
    items: [
      { id: 'u1', is_active: true, permissions: [] },
      { id: 'u2', is_active: false, permissions: [] },
    ],
    total: 2,
  } as unknown as Awaited<ReturnType<typeof adminService.getUsers>>);
