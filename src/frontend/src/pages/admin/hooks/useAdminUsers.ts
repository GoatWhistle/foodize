import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { adminService } from '../../../services/adminService';
import { useModalStore } from '@shared/store/useModalStore';
import { useDebounce } from '@shared/utils/useDebounce';
import {
  ADMIN_PERMISSIONS,
  PERMISSION_PRESETS,
  permissionPresetName,
} from '@shared/utils/permissions';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { AdminUser } from '@shared/types/models';
import { createDetailLoader } from '../../../utils/createDetailLoader';

export type { AdminUser };

export const PAGE_SIZE = 20;

type PresetKey = keyof typeof PERMISSION_PRESETS;

export interface UseAdminUsersArgs {
  activeTab: string;
  setActionError: Dispatch<SetStateAction<string>>;
  setActionSuccess: (message: string) => void;
  permissionActionLoading: boolean;
  setPermissionActionLoading: Dispatch<SetStateAction<boolean>>;
}

export interface UserFilters {
  role: string;
}

export const useAdminUsers = ({
  activeTab,
  setActionError,
  setActionSuccess,
  setPermissionActionLoading,
}: UseAdminUsersArgs) => {
  const { t } = useTranslation();
  const requestConfirm = useModalStore((s) => s.requestConfirm);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userFilters, setUserFilters] = useState<UserFilters>({ role: '' });
  const [userSearchRaw, setUserSearchRaw] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [batchUsersLoading, setBatchUsersLoading] = useState(false);

  const userSearch = useDebounce(userSearchRaw);

  useEffect(() => { setSelectedUserIds(new Set()); }, [usersPage]);

  useEffect(() => {
    if (activeTab !== 'users') return;
    const controller = new AbortController();
    setUsersLoading(true);
    void (async () => {
      try {
        const { items, total } = await adminService.getUsers({
          page: usersPage,
          size: PAGE_SIZE,
          search: userSearch || undefined,
          role: userFilters.role || undefined,
        });
        if (controller.signal.aborted) return;
        setUsers(items);
        setUsersTotal(total);
      } catch {
        if (!controller.signal.aborted) setActionError(t('admin.users.errors.loadFailed'));
      } finally {
        if (!controller.signal.aborted) setUsersLoading(false);
      }
    })();
    return () => {
      controller.abort();
    };
  }, [activeTab, usersPage, userFilters, userSearch, setActionError, t]);

  const loadUserDetails = createDetailLoader<AdminUser | null>(
    setUserDetailsLoading,
    setSelectedUser,
    adminService.getUser,
    t('admin.users.errors.detailsFailed'),
    setActionError
  );

  const handleDeleteUser = (id: string) => {
    requestConfirm({
      title: t('admin.users.dialogs.blockTitle'),
      message: t('admin.users.dialogs.blockMessage'),
      confirmLabel: t('admin.users.dialogs.blockConfirm'),
      danger: true,
      onConfirm: async () => {
        setActionError('');
        try {
          await adminService.deleteUser(id);
          setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: false } : u)));
          setSelectedUser((prev) => (prev?.id === id ? { ...prev, is_active: false } : prev));
        } catch {
          setActionError(t('admin.users.errors.blockFailed'));
        }
      },
    });
  };

  const handleActivateUser = async (userId: string) => {
    setPermissionActionLoading(true);
    setActionError('');
    try {
      await adminService.activateUser(userId);
      setSelectedUser((prev) => (prev ? { ...prev, is_active: true } : prev));
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: true } : u)));
    } catch {
      setActionError(t('admin.users.errors.unblockFailed'));
    } finally {
      setPermissionActionLoading(false);
    }
  };

  const handleMakeAdmin = (userId: string) => {
    requestConfirm({
      title: t('admin.users.dialogs.makeAdminTitle'),
      message: t('admin.users.dialogs.makeAdminMessage'),
      confirmLabel: t('admin.users.dialogs.makeAdminConfirm'),
      onConfirm: async () => {
        setPermissionActionLoading(true);
        setActionError('');
        try {
          await adminService.grantAdmin(userId);
          const adminPerms = ADMIN_PERMISSIONS as AdminUser['permissions'];
          setSelectedUser((prev) => (prev ? { ...prev, permissions: adminPerms } : prev));
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, permissions: adminPerms } : u))
          );
        } catch {
          setActionError(t('admin.users.errors.roleChangeFailed'));
        } finally {
          setPermissionActionLoading(false);
        }
      },
    });
  };

  const handleSetPermissionPreset = (userId: string, preset: PresetKey) => {
    const permissions = PERMISSION_PRESETS[preset] as AdminUser['permissions'];
    requestConfirm({
      title: t('admin.users.dialogs.setPresetTitle', { preset: permissionPresetName(preset) }),
      message: t('admin.users.dialogs.setPresetMessage', { preset: permissionPresetName(preset) }),
      confirmLabel: t('admin.users.dialogs.setPresetConfirm'),
      onConfirm: async () => {
        setPermissionActionLoading(true);
        setActionError('');
        try {
          await adminService.setPermissions(userId, permissions);
          setSelectedUser((prev) => (prev ? { ...prev, permissions } : prev));
          setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, permissions } : u)));
        } catch {
          setActionError(t('admin.users.errors.roleChangeFailed'));
        } finally {
          setPermissionActionLoading(false);
        }
      },
    });
  };

  const handleBatchUsers_execute = async (action: 'activate' | 'deactivate', ids: string[]) => {
    setBatchUsersLoading(true);
    try {
      if (action === 'deactivate') await adminService.batchDeactivateUsers(ids);
      else await adminService.batchActivateUsers(ids);
      setSelectedUserIds(new Set());
      setActionSuccess(t('admin.users.messages.batchDone', { count: ids.length }));
      setUsersPage(1);
      setUserFilters((f) => ({ ...f }));
    } catch {
      setActionError(t('admin.users.errors.batchFailed'));
    } finally {
      setBatchUsersLoading(false);
    }
  };

  const handleBatchUsers = (action: 'activate' | 'deactivate') => {
    const ids = Array.from(selectedUserIds);
    if (action === 'deactivate') {
      requestConfirm({
        title: t('admin.users.dialogs.batchDeactivateTitle', { count: ids.length }),
        message: t('admin.users.dialogs.batchDeactivateMessage'),
        confirmLabel: t('admin.users.dialogs.batchDeactivateConfirm'),
        danger: true,
        onConfirm: () => handleBatchUsers_execute('deactivate', ids),
      });
      return;
    }
    void handleBatchUsers_execute(action, ids);
  };

  return {
    users,
    usersPage, setUsersPage,
    usersTotal,
    usersLoading,
    selectedUser, setSelectedUser,
    userDetailsLoading,
    userFilters, setUserFilters,
    userSearchRaw, setUserSearchRaw,
    selectedUserIds, setSelectedUserIds,
    batchUsersLoading,
    loadUserDetails,
    handleDeleteUser,
    handleActivateUser,
    handleMakeAdmin,
    handleSetPermissionPreset,
    handleBatchUsers,
  };
};
