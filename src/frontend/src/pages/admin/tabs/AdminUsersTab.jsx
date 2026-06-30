import { Trash } from '@phosphor-icons/react';
import Pagination from '../../../components/ui/Pagination';
import EmptyState from '../../../components/ui/EmptyState';
import { PERMISSION_PRESET_RU, hasPermission, permissionPresetLabel, PERMISSIONS } from '../../../utils/permissions';

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
};

const wideFilterGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 8,
  alignItems: 'center',
};

const filterControlStyle = {
  minWidth: 0,
  height: 48,
  paddingTop: 11,
  paddingBottom: 11,
  fontSize: '0.86rem',
  lineHeight: 1.2,
};

const selectFilterStyle = {
  ...filterControlStyle,
  paddingRight: 34,
  backgroundPosition: 'right 10px center',
};

export default function AdminUsersTab({
  users,
  usersLoading,
  usersTotal,
  usersPage,
  setUsersPage,
  userSearchRaw,
  setUserSearchRaw,
  setUsersPage: _setUsersPage,
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
}) {
  const isEmpty = !Array.isArray(users) || users.length === 0;

  if (usersLoading && isEmpty) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: 16,
            }}
          >
            <div className="skeleton" style={{ width: '30%', height: 16, marginBottom: 8, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={usersLoading ? 'loading-dim' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={wideFilterGridStyle}>
        <input
          className="form-input"
          style={filterControlStyle}
          placeholder="Поиск по имени или телефону"
          value={userSearchRaw}
          onChange={(event) => {
            setUsersPage(1);
            setUserSearchRaw(event.target.value);
          }}
        />
        <select
          className="form-input"
          style={selectFilterStyle}
          value={userFilters.role}
          onChange={(event) => {
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
              setSelectedUserIds(
                e.target.checked ? new Set(users.map((u) => u.id)) : new Set()
              )
            }
          />
          Выбрать все
        </label>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exportLoading}
          onClick={() =>
            handleExport(adminService.exportUsersCSV, `пользователи_${todayStr}.csv`)
          }
        >
          {exportLoading ? '...' : '↓ CSV'}
        </button>
      </div>

      {users.map((u) => (
        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={selectedUserIds.has(u.id)}
            onChange={(e) => {
              e.stopPropagation();
              setSelectedUserIds((prev) => {
                const next = new Set(prev);
                if (e.target.checked) next.add(u.id);
                else next.delete(u.id);
                return next;
              });
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ flexShrink: 0 }}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => loadUserDetails(u.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                loadUserDetails(u.id);
              }
            }}
            style={{
              ...cardStyle,
              padding: 16,
              flex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 14,
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minWidth: 0,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: 'var(--text-1)' }}>
                  {u.name || 'Без имени'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                  {u.phone_number || 'Нет телефона'}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span className="order-status-badge pending">
                    {permissionPresetLabel(u.permissions)}
                  </span>
                  <span
                    className={`order-status-badge ${u.is_active ? 'ready' : 'cancelled'}`}
                  >
                    {u.is_active ? 'Активен' : 'Заблокирован'}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {u.id !== currentUser?.id &&
                !hasPermission(u, PERMISSIONS.ADMIN_ACCESS) && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteUser(u.id);
                    }}
                    title="Заблокировать"
                    style={{ color: 'var(--error)' }}
                  >
                    <Trash size={16} />
                  </button>
                )}
            </div>
          </div>
        </div>
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
