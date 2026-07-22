import type { Dispatch, SetStateAction } from 'react';
import { UserCircleIcon, StorefrontIcon, MonitorIcon, QrCodeIcon, TrashIcon, CheckCircleIcon, ProhibitIcon, StarIcon } from '@phosphor-icons/react';
import type { AdminRestaurant } from '@shared/types/models';
import { approvalStatusLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';
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
}: RestaurantDetailModalProps) => {
  const { t } = useTranslation();
  return (
  <DetailModal
    title={selectedRestaurant.name}
    subtitle={t('admin.restaurants.modal.subtitle')}
    loading={restaurantDetailsLoading}
    onClose={() => { setSelectedRestaurant(null); }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <UserCircleIcon size={18} color="var(--fire)" />
        <span style={{ fontWeight: 800 }}>{t('admin.restaurants.modal.vendorSection')}</span>
      </div>
      <div style={{ marginBottom: 16 }}>
        <DetailField label={t('common.labels.name')}>
          {selectedRestaurant.vendor_name || t('common.states.notSpecified')}
        </DetailField>
        <DetailField label={t('common.labels.phone')}>
          {selectedRestaurant.vendor_phone || t('common.states.notSpecifiedMale')}
        </DetailField>
        <div style={{ color: 'var(--text-3)', fontSize: "var(--text-base)", marginTop: 4 }}>
          ID: {selectedRestaurant.vendor_id}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <StorefrontIcon size={18} color="var(--fire)" />
        <span style={{ fontWeight: 800 }}>{t('admin.restaurants.modal.venueSection')}</span>
      </div>
      <div>
        <DetailField label={t('common.labels.title')}>{selectedRestaurant.name}</DetailField>
        <DetailField label={t('common.labels.address')}>{selectedRestaurant.address}</DetailField>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginTop: 8,
          }}
        >
          <DetailField label={t('admin.restaurants.modal.fields.orders')}>{selectedRestaurant.orders_count}</DetailField>
          <DetailField label={t('admin.restaurants.modal.fields.reviews')}>{selectedRestaurant.review_count}</DetailField>
          <DetailField label={t('admin.restaurants.modal.fields.rating')}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <StarIcon size={14} weight="fill" color="var(--star)" /> {selectedRestaurant.average_rating || 0}
            </span>
          </DetailField>
          <DetailField label={t('common.labels.createdAt')}>{formatDateTime(selectedRestaurant.created_at)}</DetailField>
          <DetailField label={t('admin.restaurants.modal.fields.moderation')}>
            <span className="order-status-badge pending">
              {approvalStatusLabel(selectedRestaurant.moderation_status)}
            </span>
          </DetailField>
          <DetailField label={t('admin.restaurants.modal.fields.work')}>
            <span
              className={`order-status-badge ${selectedRestaurant.is_open ? 'ready' : 'cancelled'}`}
            >
              {selectedRestaurant.is_open ? t('admin.restaurants.modal.open') : t('admin.restaurants.modal.closed')}
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
        <DetailField label={t('common.labels.reason')}>
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
          {approveLoading ? t('common.actions.approving') : t('common.actions.approve')}
        </button>
      )}
      {selectedRestaurant.moderation_status !== 'REJECTED' && (
        <button
          className="btn btn-secondary"
          onClick={() => { handleRejectRestaurant(selectedRestaurant.id); }}
          style={{ color: 'var(--error)' }}
        >
          <ProhibitIcon size={16} />
          {t('common.actions.reject')}
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
      {t('admin.restaurants.modal.openDisplayBoard')}
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
      {t('admin.restaurants.modal.qrSite')}
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
      {t('admin.restaurants.modal.qrTelegram')}
    </button>
    <button
      className="btn btn-secondary"
      style={{ marginTop: 8, color: 'var(--error)' }}
      onClick={() => { handleDeleteRestaurant(selectedRestaurant.id); }}
    >
      <TrashIcon size={16} />
      {t('admin.restaurants.modal.deleteRestaurant')}
    </button>
  </DetailModal>
  );
};
