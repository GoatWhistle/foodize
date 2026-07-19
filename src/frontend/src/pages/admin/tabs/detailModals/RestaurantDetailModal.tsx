import type { Dispatch, SetStateAction } from 'react';
import { UserCircleIcon, StorefrontIcon, MonitorIcon, QrCodeIcon, TrashIcon, CheckCircleIcon, ProhibitIcon, StarIcon } from '@phosphor-icons/react';
import type { AdminRestaurant } from '@shared/types/models';
import { APPROVAL_STATUS_RU, translate } from '@shared/utils/locales';
import type { QrType } from '../../useAdminDashboard';
import { DetailField, DetailModal, formatDateTime } from './adminModal.shared';

interface RestaurantDetailModalProps {
  selectedRestaurant: AdminRestaurant;
  setSelectedRestaurant: Dispatch<SetStateAction<AdminRestaurant | null>>;
  restaurantDetailsLoading: boolean;
  approveLoading: boolean;
  handleApproveRestaurant: (restaurantId: string) => void;
  handleRejectRestaurant: (restaurantId: string) => void;
  handleDeleteRestaurant: (restaurantId: string) => void;
  setQrType: Dispatch<SetStateAction<QrType>>;
  setQrRestaurant: Dispatch<SetStateAction<AdminRestaurant | null>>;
}

export const RestaurantDetailModal = ({
  selectedRestaurant,
  setSelectedRestaurant,
  restaurantDetailsLoading,
  approveLoading,
  handleApproveRestaurant,
  handleRejectRestaurant,
  handleDeleteRestaurant,
  setQrType,
  setQrRestaurant,
}: RestaurantDetailModalProps) => (
  <DetailModal
    title={selectedRestaurant.name}
    subtitle="Детали ресторана"
    loading={restaurantDetailsLoading}
    onClose={() => { setSelectedRestaurant(null); }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <UserCircleIcon size={18} color="var(--fire)" />
        <span style={{ fontWeight: 800 }}>Вендор</span>
      </div>
      <div style={{ marginBottom: 16 }}>
        <DetailField label="Имя">
          {selectedRestaurant.vendor_name || 'Не указано'}
        </DetailField>
        <DetailField label="Телефон">
          {selectedRestaurant.vendor_phone || 'Не указан'}
        </DetailField>
        <div style={{ color: 'var(--text-3)', fontSize: "var(--text-base)", marginTop: 4 }}>
          ID: {selectedRestaurant.vendor_id}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <StorefrontIcon size={18} color="var(--fire)" />
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
          <DetailField label="Рейтинг">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <StarIcon size={14} weight="fill" color="var(--star)" /> {selectedRestaurant.average_rating || 0}
            </span>
          </DetailField>
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
        <div style={{ color: 'var(--text-3)', fontSize: "var(--text-base)", marginTop: 12 }}>
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
          onClick={() => { handleApproveRestaurant(selectedRestaurant.id); }}
          disabled={approveLoading}
        >
          <CheckCircleIcon size={16} />
          {approveLoading ? 'Одобрение...' : 'Одобрить'}
        </button>
      )}
      {selectedRestaurant.moderation_status !== 'REJECTED' && (
        <button
          className="btn btn-secondary"
          onClick={() => { handleRejectRestaurant(selectedRestaurant.id); }}
          style={{ color: 'var(--error)' }}
        >
          <ProhibitIcon size={16} />
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
      <MonitorIcon size={16} />
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
      <QrCodeIcon size={16} />
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
      <QrCodeIcon size={16} />
      QR для Telegram
    </button>
    <button
      className="btn btn-secondary"
      style={{ marginTop: 8, color: 'var(--error)' }}
      onClick={() => { handleDeleteRestaurant(selectedRestaurant.id); }}
    >
      <TrashIcon size={16} />
      Удалить ресторан
    </button>
  </DetailModal>
);
