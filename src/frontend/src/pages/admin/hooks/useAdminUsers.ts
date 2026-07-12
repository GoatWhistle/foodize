import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { adminService } from '../../../services/adminService';
import { useModalStore } from '@shared/store/useModalStore';
import { useDebounce } from '@shared/utils/useDebounce';
import {
  ADMIN_PERMISSIONS,
  PERMISSION_PRESET_RU,
  PERMISSION_PRESETS,
} from '@shared/utils/permissions';
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
    let cancelled = false;
    setUsersLoading(true);
    adminService
      .getUsers({
        page: usersPage,
        size: PAGE_SIZE,
        search: userSearch || undefined,
        role: userFilters.role || undefined,
      })
      .then((res) => {
        if (cancelled) return;
        const body = res.data;
        setUsers(body.data);
        setUsersTotal(body.pagination.total || 0);
      })
      .catch(() => {
        if (!cancelled) setActionError('Не удалось загрузить пользователей');
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, usersPage, userFilters, userSearch, setActionError]);

  const loadUserDetails = createDetailLoader<AdminUser | null>(
    setUserDetailsLoading,
    setSelectedUser,
    adminService.getUser,
    'Не удалось загрузить детали пользователя',
    setActionError
  );

  const handleDeleteUser = (id: string) => {
    requestConfirm({
      title: 'Заблокировать пользователя?',
      message: 'Пользователь больше не сможет пользоваться аккаунтом, пока вы его не разблокируете.',
      confirmLabel: 'Заблокировать',
      danger: true,
      onConfirm: async () => {
        setActionError('');
        try {
          await adminService.deleteUser(id);
          setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: false } : u)));
          setSelectedUser((prev) => (prev?.id === id ? { ...prev, is_active: false } : prev));
        } catch {
          setActionError('Не удалось заблокировать пользователя');
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
      setActionError('Не удалось разблокировать пользователя');
    } finally {
      setPermissionActionLoading(false);
    }
  };

  const handleMakeAdmin = (userId: string) => {
    requestConfirm({
      title: 'Сделать пользователя админом?',
      message: 'Точно ли вы хотите дать этому пользователю права администратора?',
      confirmLabel: 'Сделать админом',
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
          setActionError('Не удалось изменить роль');
        } finally {
          setPermissionActionLoading(false);
        }
      },
    });
  };

  const handleSetPermissionPreset = (userId: string, preset: PresetKey) => {
    const permissions = PERMISSION_PRESETS[preset] as AdminUser['permissions'];
    requestConfirm({
      title: `Установить роль: ${PERMISSION_PRESET_RU[preset]}?`,
      message: `Права пользователя будут заменены на пресет «${PERMISSION_PRESET_RU[preset]}».`,
      confirmLabel: 'Изменить',
      onConfirm: async () => {
        setPermissionActionLoading(true);
        setActionError('');
        try {
          await adminService.setPermissions(userId, permissions);
          setSelectedUser((prev) => (prev ? { ...prev, permissions } : prev));
          setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, permissions } : u)));
        } catch {
          setActionError('Не удалось изменить роль');
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
      setActionSuccess(`Готово: ${ids.length} пользователей`);
      setUsersPage(1);
      setUserFilters((f) => ({ ...f }));
    } catch {
      setActionError('Ошибка при массовом действии');
    } finally {
      setBatchUsersLoading(false);
    }
  };

  const handleBatchUsers = (action: 'activate' | 'deactivate') => {
    const ids = Array.from(selectedUserIds);
    if (action === 'deactivate') {
      requestConfirm({
        title: `Деактивировать ${ids.length} пользователей?`,
        message: 'Они потеряют доступ к аккаунту.',
        confirmLabel: 'Деактивировать',
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
