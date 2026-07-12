import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import Pagination from '@shared/components/Pagination/Pagination';
import EmptyState from '@shared/components/EmptyState/EmptyState';
import { PERMISSION_PRESET_RU } from '@shared/utils/permissions';
import type { AuthUser } from '@shared/store/createAuthStore';
import type { adminService as AdminService } from '../../../services/adminService';
import type { AdminUser, UserFilters } from '../hooks/useAdminUsers';
import { AdminUserCard } from './components/AdminUserCard';
import styles from './components/adminTable.module.css';

export interface AdminUsersTabProps {
  users: AdminUser[];
  usersLoading: boolean;
  usersTotal: number;
  usersPage: number;
  setUsersPage: Dispatch<SetStateAction<number>>;
  userSearchRaw: string;
  setUserSearchRaw: Dispatch<SetStateAction<string>>;
  userFilters: UserFilters;
  setUserFilters: Dispatch<SetStateAction<UserFilters>>;
  selectedUserIds: Set<string>;
  setSelectedUserIds: Dispatch<SetStateAction<Set<string>>>;
  exportLoading: boolean;
  handleExport: (exportFn: () => Promise<{ data: Blob }>, filename: string) => void;
  loadUserDetails: (id: string) => void;
  handleDeleteUser: (id: string) => void;
  currentUser: AuthUser | null;
  todayStr: string;
  adminService: typeof AdminService;
  PAGE_SIZE: number;
}

export default function AdminUsersTab({
  users,
  usersLoading,
  usersTotal,
  usersPage,
  setUsersPage,
  userSearchRaw,
  setUserSearchRaw,
  userFilters,
  setUserFilters,
  selectedUserIds,
  setSelectedUserIds,
  exportLoading,
  handleExport,
  loadUserDetails,
  handleDeleteUser,
  currentUser,
  todayStr,
  adminService,
  PAGE_SIZE,
}: AdminUsersTabProps) {
  const isEmpty = !Array.isArray(users) || users.length === 0;

  if (usersLoading && isEmpty) {
    return (
      <div className={styles.list}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '30%' }} />
            <div className={`skeleton ${styles.skeletonLineSub}`} style={{ width: '70%' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${styles.list} ${usersLoading ? 'loading-dim' : ''}`}>
      <div className={styles.wideFilterGrid}>
        <input
          className={`form-input ${styles.filterControl}`}
          placeholder="Поиск по имени или телефону"
          value={userSearchRaw}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setUsersPage(1);
            setUserSearchRaw(event.target.value);
          }}
        />
        <select
          className={`form-input ${styles.filterControl} ${styles.selectFilter}`}
          value={userFilters.role}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            setUsersPage(1);
            setUserFilters((prev) => ({ ...prev, role: event.target.value }));
          }}
        >
          <option value="">Все роли</option>
          {Object.entries(PERMISSION_PRESET_RU)
            .filter(([val]) => val !== 'CUSTOMER')
            .map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
        </select>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.82rem',
            color: 'var(--text-3)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={users.length > 0 && selectedUserIds.size === users.length}
            onChange={(e) =>
              { setSelectedUserIds(
                e.target.checked ? new Set(users.map((u) => u.id)) : new Set()
              ); }
            }
          />
          Выбрать все
        </label>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exportLoading}
          onClick={() =>
            { handleExport(adminService.exportUsersCSV, `пользователи_${todayStr}.csv`); }
          }
        >
          {exportLoading ? '...' : <><DownloadSimpleIcon size={16} weight="bold" /> CSV</>}
        </button>
      </div>

      {users.map((u) => (
        <AdminUserCard
          key={u.id}
          user={u}
          selected={selectedUserIds.has(u.id)}
          currentUser={currentUser}
          onToggleSelect={(id, checked) =>
            { setSelectedUserIds((prev) => {
              const next = new Set(prev);
              if (checked) next.add(id);
              else next.delete(id);
              return next;
            }); }
          }
          onOpen={loadUserDetails}
          onDelete={handleDeleteUser}
        />
      ))}

      {isEmpty && (
        <EmptyState
          title="Пользователей пока нет"
          subtitle="Для выбранных фильтров нет результатов"
        />
      )}

      <Pagination
        page={usersPage}
        totalPages={Math.ceil(usersTotal / PAGE_SIZE)}
        onPageChange={setUsersPage}
      />
    </div>
  );
}
