import { TrashIcon } from '@phosphor-icons/react';
import { hasPermission, permissionPresetLabel, PERMISSIONS } from '@shared/utils/permissions';
import type { AuthUser } from '@shared/store/createAuthStore';
import type { AdminUser } from '../../hooks/useAdminUsers';
import styles from './adminTable.module.css';

interface AdminUserCardProps {
  user: AdminUser;
  selected: boolean;
  currentUser: AuthUser | null;
  onToggleSelect: (id: string, checked: boolean) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AdminUserCard({
  user,
  selected,
  currentUser,
  onToggleSelect,
  onOpen,
  onDelete,
}: AdminUserCardProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => {
          e.stopPropagation();
          onToggleSelect(user.id, e.target.checked);
        }}
        onClick={(e) => { e.stopPropagation(); }}
        style={{ flexShrink: 0 }}
      />
      <div
        role="button"
        tabIndex={0}
        className={styles.card}
        onClick={() => { onOpen(user.id); }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen(user.id);
          }
        }}
        style={{
          padding: 16,
          flex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 14,
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: 'var(--text-1)' }}>
              {user.name || 'Без имени'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
              {user.phone_number || 'Нет телефона'}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <span className="order-status-badge pending">
                {permissionPresetLabel(user.permissions)}
              </span>
              <span className={`order-status-badge ${user.is_active ? 'ready' : 'cancelled'}`}>
                {user.is_active ? 'Активен' : 'Заблокирован'}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {user.id !== currentUser?.id && !hasPermission(user, PERMISSIONS.ADMIN_ACCESS) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(user.id);
              }}
              title="Заблокировать"
              style={{ color: 'var(--error)' }}
            >
              <TrashIcon size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
