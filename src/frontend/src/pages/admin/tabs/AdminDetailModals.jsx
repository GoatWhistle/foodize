import { X, UserCircle, Storefront, Monitor, QrCode, Trash, CheckCircle, Prohibit } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import OrderDetailsModal from '../../../components/ui/OrderDetailsModal';
import { APPROVAL_STATUS_RU, translate } from '../../../utils/locales';
import { PERMISSION_PRESET_RU, hasPermission, permissionPresetLabel, PERMISSIONS } from '../../../utils/permissions';

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DetailField = ({ label, children, mono = false }) => (
  <div
    style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-sm)',
      padding: 12,
      minWidth: 0,
    }}
  >
    <div
      style={{
        color: 'var(--text-3)',
        fontSize: '0.7rem',
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div
      style={{
        color: 'var(--text-1)',
        fontWeight: 800,
        fontSize: mono ? '0.78rem' : '0.9rem',
        fontFamily: mono ? 'monospace' : 'inherit',
        overflowWrap: 'anywhere',
      }}
    >
      {children ?? '—'}
    </div>
  </div>
);

const DetailModal = ({ title, subtitle, onClose, loading, children }) => (
  <div
    className="modal-overlay"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <div
      className="modal-content"
      style={{
        maxWidth: 620,
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '20px 22px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{ color: 'var(--text-3)', fontSize: '0.78rem', fontWeight: 800 }}
          >
            {subtitle}
          </div>
          <h3 style={{ margin: '4px 0 0', color: 'var(--text-1)', fontSize: '1.18rem' }}>
            {title}
          </h3>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X size={16} />
        </button>
      </div>
      <div style={{ padding: 22, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ width: '100%', height: 24, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: '80%', height: 16, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: '90%', height: 16, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 4 }} />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  </div>
);

export const ReasonDialog = ({ dialog, loading, onCancel, onConfirm }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason('');
  }, [dialog]);

  if (!dialog) return null;

  const trimmedReason = reason.trim();

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 5000 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: 480,
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <h3 style={{ color: 'var(--text-1)', fontSize: '1.05rem', margin: 0 }}>
            {dialog.title}
          </h3>
          <p
            style={{
              color: 'var(--text-3)',
              fontSize: '0.88rem',
              lineHeight: 1.55,
              margin: '8px 0 0',
            }}
          >
            {dialog.message}
          </p>
        </div>
        <textarea
          className="form-input"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Напишите причину отклонения"
          rows={4}
          style={{ minHeight: 112, resize: 'vertical' }}
          autoFocus
        />
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <button className="btn btn-secondary" disabled={loading} onClick={onCancel}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            disabled={loading || !trimmedReason}
            onClick={() => onConfirm(trimmedReason)}
            style={{ background: 'var(--error)' }}
          >
            {loading ? 'Выполняю...' : dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminDetailModals({
  selectedUser,
  setSelectedUser,
  userDetailsLoading,
  currentUser,
  permissionActionLoading,
  handleSetPermissionPreset,
  handleMakeAdmin,
  handleActivateUser,
  handleDeleteUser,

  selectedRestaurant,
  setSelectedRestaurant,
  restaurantDetailsLoading,
  approveLoading,
  handleApproveRestaurant,
  handleRejectRestaurant,
  handleDeleteRestaurant,
  setQrType,
  setQrRestaurant,

  selectedVendor,
  setSelectedVendor,
  vendorDetailsLoading,
  handleApproveVendor,
  handleRejectVendor,
  handleDeleteVendor,

  selectedOrder,
  setSelectedOrder,
}) {
  return (
    <>
      {selectedUser && (
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
                    {['CUSTOMER', 'VENDOR', 'STAFF'].map(
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
                  style={{ color: '#22c55e' }}
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
      )}

      {selectedRestaurant && (
        <DetailModal
          title={selectedRestaurant.name}
          subtitle="Детали ресторана"
          loading={restaurantDetailsLoading}
          onClose={() => setSelectedRestaurant(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <UserCircle size={18} color="var(--fire)" />
              <span style={{ fontWeight: 800 }}>Вендор</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <DetailField label="Имя">
                {selectedRestaurant.vendor_name || 'Не указано'}
              </DetailField>
              <DetailField label="Телефон">
                {selectedRestaurant.vendor_phone || 'Не указан'}
              </DetailField>
              <div style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginTop: 4 }}>
                ID: {selectedRestaurant.vendor_id}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Storefront size={18} color="var(--fire)" />
              <span style={{ fontWeight: 800 }}>Заведение</span>
            </div>
            <div>
              <DetailField label="Название">{selectedRestaurant.name}</DetailField>
              <DetailField label="Адрес">{selectedRestaurant.address}</DetailField>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <DetailField label="Заказы">{selectedRestaurant.orders_count}</DetailField>
                <DetailField label="Отзывы">{selectedRestaurant.review_count}</DetailField>
                <DetailField label="Рейтинг">★ {selectedRestaurant.average_rating || 0}</DetailField>
                <DetailField label="Создан">{formatDateTime(selectedRestaurant.created_at)}</DetailField>
                <DetailField label="Модерация">
                  <span className="order-status-badge pending">
                    {translate(APPROVAL_STATUS_RU, selectedRestaurant.moderation_status)}
                  </span>
                </DetailField>
                <DetailField label="Работа">
                  <span
                    className={`order-status-badge ${selectedRestaurant.is_open ? 'ready' : 'cancelled'}`}
                  >
                    {selectedRestaurant.is_open ? 'Открыт' : 'Закрыт'}
                  </span>
                </DetailField>
              </div>
              <div style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginTop: 12 }}>
                ID: {selectedRestaurant.id}
              </div>
            </div>
          </div>
          {selectedRestaurant.rejection_reason && (
            <div style={{ marginTop: 10 }}>
              <DetailField label="Причина отклонения">
                {selectedRestaurant.rejection_reason}
              </DetailField>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {selectedRestaurant.moderation_status !== 'APPROVED' && (
              <button
                className="btn btn-secondary"
                onClick={() => handleApproveRestaurant(selectedRestaurant.id)}
                disabled={approveLoading}
              >
                <CheckCircle size={16} />
                {approveLoading ? 'Одобрение...' : 'Одобрить'}
              </button>
            )}
            {selectedRestaurant.moderation_status !== 'REJECTED' && (
              <button
                className="btn btn-secondary"
                onClick={() => handleRejectRestaurant(selectedRestaurant.id)}
                style={{ color: 'var(--error)' }}
              >
                <Prohibit size={16} />
                Отклонить
              </button>
            )}
          </div>
          <button
            className="btn btn-secondary"
            style={{ marginTop: 8 }}
            onClick={() =>
              window.open(
                `/display-board/${selectedRestaurant.id}`,
                '_blank',
                'noopener,noreferrer'
              )
            }
          >
            <Monitor size={16} />
            Открыть табло
          </button>
          <button
            className="btn btn-secondary"
            style={{ marginTop: 8 }}
            onClick={() => {
              setQrType('site');
              setQrRestaurant(selectedRestaurant);
            }}
          >
            <QrCode size={16} />
            QR для сайта
          </button>
          <button
            className="btn btn-secondary"
            style={{ marginTop: 8 }}
            onClick={() => {
              setQrType('telegram');
              setQrRestaurant(selectedRestaurant);
            }}
          >
            <QrCode size={16} />
            QR для Telegram
          </button>
          <button
            className="btn btn-secondary"
            style={{ marginTop: 8, color: 'var(--error)' }}
            onClick={() => handleDeleteRestaurant(selectedRestaurant.id)}
          >
            <Trash size={16} />
            Удалить ресторан
          </button>
        </DetailModal>
      )}

      {selectedVendor && (
        <DetailModal
          title={selectedVendor.name || 'Вендор'}
          subtitle="Детали вендора"
          loading={vendorDetailsLoading}
          onClose={() => setSelectedVendor(null)}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 10,
            }}
          >
            <DetailField label="ID профиля" mono>{selectedVendor.id}</DetailField>
            <DetailField label="ID пользователя" mono>{selectedVendor.user_id}</DetailField>
            <DetailField label="Имя">{selectedVendor.name}</DetailField>
            <DetailField label="Телефон">{selectedVendor.phone_number}</DetailField>
            <DetailField label="Рестораны">{selectedVendor.restaurants_count}</DetailField>
            <DetailField label="Модерация">
              <span className="order-status-badge pending">
                {translate(APPROVAL_STATUS_RU, selectedVendor.approval_status)}
              </span>
            </DetailField>
            <DetailField label="Создан">{formatDateTime(selectedVendor.created_at)}</DetailField>
          </div>
          {selectedVendor.rejection_reason && (
            <div style={{ marginTop: 10 }}>
              <DetailField label="Причина отклонения">
                {selectedVendor.rejection_reason}
              </DetailField>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {selectedVendor.approval_status !== 'APPROVED' && (
              <button
                className="btn btn-secondary"
                disabled={approveLoading}
                onClick={() => handleApproveVendor(selectedVendor.id)}
              >
                <CheckCircle size={16} />
                {approveLoading ? 'Одобрение...' : 'Одобрить'}
              </button>
            )}
            {selectedVendor.approval_status !== 'REJECTED' && (
              <button
                className="btn btn-secondary"
                disabled={approveLoading}
                onClick={() => handleRejectVendor(selectedVendor.id)}
                style={{ color: 'var(--error)' }}
              >
                <Prohibit size={16} />
                Отклонить
              </button>
            )}
          </div>
          <button
            className="btn btn-secondary"
            style={{ marginTop: 16, color: 'var(--error)' }}
            onClick={() => handleDeleteVendor(selectedVendor.id)}
          >
            <Trash size={16} />
            Удалить вендора
          </button>
        </DetailModal>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          updating={null}
        />
      )}
    </>
  );
}
