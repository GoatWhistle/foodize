import { useState, useEffect } from 'react';
import { adminService } from '../../../services/adminService';
import { useModalStore } from '../../../store/useModalStore';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  ADMIN_PERMISSIONS,
  CUSTOMER_PERMISSIONS,
  PERMISSION_PRESET_RU,
  PERMISSION_PRESETS,
} from '../../../utils/permissions';
import { createDetailLoader } from '../../../utils/createDetailLoader';

const PAGE_SIZE = 20;

export const useAdminUsers = ({ activeTab, setActionError, setActionSuccess, permissionActionLoading, setPermissionActionLoading }) => {
  const requestConfirm = useModalStore((s) => s.requestConfirm);

  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userFilters, setUserFilters] = useState({ role: '' });
  const [userSearchRaw, setUserSearchRaw] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [batchUsersLoading, setBatchUsersLoading] = useState(false);

  const userSearch = useDebounce(userSearchRaw);

  useEffect(() => { setSelectedUserIds(new Set()); }, [usersPage]);

  useEffect(() => {
    if (activeTab !== 'users') return;
    setUsersLoading(true);
    adminService
      .getUsers({
        page: usersPage,
        size: PAGE_SIZE,
        search: userSearch || undefined,
        role: userFilters.role || undefined,
      })
      .then((res) => {
        setUsers(res.data.data || []);
        setUsersTotal(res.data.pagination?.total || 0);
      })
      .catch(() => setActionError('Не удалось загрузить пользователей'))
      .finally(() => setUsersLoading(false));
  }, [activeTab, usersPage, userFilters, userSearch]);

  const loadUserDetails = createDetailLoader(
    setUserDetailsLoading,
    setSelectedUser,
    adminService.getUser,
    'Не удалось загрузить детали пользователя',
    setActionError
  );

  const handleDeleteUser = async (id) => {
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

  const handleActivateUser = async (userId) => {
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

  const handleMakeAdmin = async (userId) => {
    requestConfirm({
      title: 'Сделать пользователя админом?',
      message: 'Точно ли вы хотите дать этому пользователю права администратора?',
      confirmLabel: 'Сделать админом',
      onConfirm: async () => {
        setPermissionActionLoading(true);
        setActionError('');
        try {
          await adminService.grantAdmin(userId);
          setSelectedUser((prev) => (prev ? { ...prev, permissions: ADMIN_PERMISSIONS } : prev));
          setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, permissions: ADMIN_PERMISSIONS } : u))
          );
        } catch {
          setActionError('Не удалось изменить роль');
        } finally {
          setPermissionActionLoading(false);
        }
      },
    });
  };

  const handleSetPermissionPreset = async (userId, preset) => {
    const permissions = PERMISSION_PRESETS[preset] || CUSTOMER_PERMISSIONS;
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

  const handleBatchUsers_execute = async (action, ids) => {
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

  const handleBatchUsers = async (action) => {
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
    handleBatchUsers_execute(action, ids);
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
