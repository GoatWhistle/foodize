import type { Dispatch, SetStateAction } from 'react';
import type { AuthUser } from '@shared/store/createAuthStore';
import type { AdminUser } from '@shared/types/models';
import { PERMISSION_PRESET_RU, PERMISSION_PRESETS, hasPermission, permissionPresetLabel, PERMISSIONS } from '@shared/utils/permissions';
import { DetailField, DetailModal, formatDateTime } from './adminModal.shared';

type PresetKey = keyof typeof PERMISSION_PRESETS;

interface UserDetailModalProps {
  selectedUser: AdminUser;
  setSelectedUser: Dispatch<SetStateAction<AdminUser | null>>;
  userDetailsLoading: boolean;
  currentUser: AuthUser | null;
  permissionActionLoading: boolean;
  handleSetPermissionPreset: (userId: string, preset: PresetKey) => void;
  handleMakeAdmin: (userId: string) => void;
  handleActivateUser: (userId: string) => void;
  handleDeleteUser: (userId: string) => void;
}

const ROLE_PRESETS: PresetKey[] = ['CUSTOMER', 'VENDOR', 'STAFF'];

export const UserDetailModal = ({
  selectedUser,
  setSelectedUser,
  userDetailsLoading,
  currentUser,
  permissionActionLoading,
  handleSetPermissionPreset,
  handleMakeAdmin,
  handleActivateUser,
  handleDeleteUser,
}: UserDetailModalProps) => (
  <DetailModal
    title={selectedUser.name || 'Пользователь'}
    subtitle="Детали профиля"
    loading={userDetailsLoading}
    onClose={() => setSelectedUser(null)}
  >
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
      }}
    >
      <DetailField label="ID" mono>{selectedUser.id}</DetailField>
      <DetailField label="ФИО">
        {[selectedUser.first_name, selectedUser.last_name]
          .filter(Boolean)
          .join(' ') || 'Не указано'}
      </DetailField>
      <DetailField label="Отображаемое имя">
        {selectedUser.name || 'Не указано'}
      </DetailField>
      <DetailField label="Телефон">
        {selectedUser.phone_number || 'Не указан'}
      </DetailField>
      {selectedUser.telegram_username && (
        <DetailField label="Telegram">@{selectedUser.telegram_username}</DetailField>
      )}
      {selectedUser.email && (
        <DetailField label="Email">{selectedUser.email}</DetailField>
      )}
      <DetailField label="Создан">{formatDateTime(selectedUser.created_at)}</DetailField>
      <DetailField label="Роль">
        <span className="order-status-badge pending">
          {permissionPresetLabel(selectedUser.permissions)}
        </span>
      </DetailField>
      <DetailField label="Статус">
        <span
          className={`order-status-badge ${selectedUser.is_active ? 'ready' : 'cancelled'}`}
        >
          {selectedUser.is_active ? 'Активен' : 'Заблокирован'}
        </span>
      </DetailField>
    </div>
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginTop: 16,
        flexWrap: 'wrap',
        flexDirection: 'column',
      }}
    >
      {selectedUser.id !== currentUser?.id &&
        !hasPermission(selectedUser, PERMISSIONS.ADMIN_ACCESS) && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Управление ролью</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ROLE_PRESETS.map(
                (role) =>
                  permissionPresetLabel(selectedUser.permissions) !==
                    PERMISSION_PRESET_RU[role] && (
                    <button
                      key={role}
                      className="btn btn-secondary btn-sm"
                      disabled={permissionActionLoading}
                      onClick={() => handleSetPermissionPreset(selectedUser.id, role)}
                    >
                      {PERMISSION_PRESET_RU[role]}
                    </button>
                  )
              )}
              <button
                className="btn btn-secondary btn-sm"
                disabled={permissionActionLoading}
                onClick={() => handleMakeAdmin(selectedUser.id)}
                style={{ color: 'var(--error)' }}
              >
                Сделать админом
              </button>
            </div>
          </div>
        )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!selectedUser.is_active && (
          <button
            className="btn btn-secondary"
            disabled={permissionActionLoading}
            onClick={() => handleActivateUser(selectedUser.id)}
            style={{ color: 'var(--success)' }}
          >
            {permissionActionLoading ? 'Применяю...' : 'Разблокировать'}
          </button>
        )}
        {selectedUser.is_active &&
          selectedUser.id !== currentUser?.id &&
          !hasPermission(selectedUser, PERMISSIONS.ADMIN_ACCESS) && (
            <button
              className="btn btn-secondary"
              disabled={permissionActionLoading}
              onClick={() => handleDeleteUser(selectedUser.id)}
              style={{ color: 'var(--error)' }}
            >
              Заблокировать пользователя
            </button>
          )}
      </div>
    </div>
  </DetailModal>
);
