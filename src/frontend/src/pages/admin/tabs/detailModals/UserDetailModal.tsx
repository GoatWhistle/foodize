import type { Dispatch, SetStateAction } from 'react';
import type { AuthUser } from '@shared/store/createAuthStore';
import type { AdminUser } from '@shared/types/models';
import { PERMISSION_PRESETS, hasPermission, permissionPresetLabel, permissionPresetName, PERMISSIONS } from '@shared/utils/permissions';
import { useTranslation } from '@shared/i18n/useTranslation';
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
}: UserDetailModalProps) => {
  const { t } = useTranslation();
  return (
  <DetailModal
    title={selectedUser.name || t('admin.users.modal.fallbackTitle')}
    subtitle={t('admin.users.modal.subtitle')}
    loading={userDetailsLoading}
    onClose={() => { setSelectedUser(null); }}
  >
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
      }}
    >
      <DetailField label="ID" mono>{selectedUser.id}</DetailField>
      <DetailField label={t('common.labels.fullName')}>
        {[selectedUser.first_name, selectedUser.last_name]
          .filter(Boolean)
          .join(' ') || t('common.states.notSpecified')}
      </DetailField>
      <DetailField label={t('common.labels.displayName')}>
        {selectedUser.name || t('common.states.notSpecified')}
      </DetailField>
      <DetailField label={t('common.labels.phone')}>
        {selectedUser.phone_number || t('common.states.notSpecifiedMale')}
      </DetailField>
      {selectedUser.telegram_username && (
        <DetailField label="Telegram">@{selectedUser.telegram_username}</DetailField>
      )}
      {selectedUser.email && (
        <DetailField label={t('common.labels.email')}>{selectedUser.email}</DetailField>
      )}
      <DetailField label={t('common.labels.createdAt')}>{formatDateTime(selectedUser.created_at)}</DetailField>
      <DetailField label={t('common.labels.role')}>
        <span className="order-status-badge pending">
          {permissionPresetLabel(selectedUser.permissions)}
        </span>
      </DetailField>
      <DetailField label={t('common.labels.status')}>
        <span
          className={`order-status-badge ${selectedUser.is_active ? 'ready' : 'cancelled'}`}
        >
          {selectedUser.is_active ? t('admin.users.card.active') : t('admin.users.card.blocked')}
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
            <div style={{ fontWeight: 800, marginBottom: 8 }}>{t('admin.users.modal.roleManagement')}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ROLE_PRESETS.map(
                (role) =>
                  permissionPresetLabel(selectedUser.permissions) !==
                    permissionPresetName(role) && (
                    <button
                      key={role}
                      className="btn btn-secondary btn-sm"
                      disabled={permissionActionLoading}
                      onClick={() => { handleSetPermissionPreset(selectedUser.id, role); }}
                    >
                      {permissionPresetName(role)}
                    </button>
                  )
              )}
              <button
                className="btn btn-secondary btn-sm"
                disabled={permissionActionLoading}
                onClick={() => { handleMakeAdmin(selectedUser.id); }}
                style={{ color: 'var(--error)' }}
              >
                {t('admin.users.modal.makeAdmin')}
              </button>
            </div>
          </div>
        )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!selectedUser.is_active && (
          <button
            className="btn btn-secondary"
            disabled={permissionActionLoading}
            onClick={() => { handleActivateUser(selectedUser.id); }}
            style={{ color: 'var(--success)' }}
          >
            {permissionActionLoading ? t('common.actions.applying') : t('admin.users.modal.unblock')}
          </button>
        )}
        {selectedUser.is_active &&
          selectedUser.id !== currentUser?.id &&
          !hasPermission(selectedUser, PERMISSIONS.ADMIN_ACCESS) && (
            <button
              className="btn btn-secondary"
              disabled={permissionActionLoading}
              onClick={() => { handleDeleteUser(selectedUser.id); }}
              style={{ color: 'var(--error)' }}
            >
              {t('admin.users.modal.block')}
            </button>
          )}
      </div>
    </div>
  </DetailModal>
  );
};
