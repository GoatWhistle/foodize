import type { Dispatch, SetStateAction } from 'react';
import { TrashIcon, CheckCircleIcon, ProhibitIcon } from '@phosphor-icons/react';
import type { AdminVendor } from '@shared/types/models';
import { APPROVAL_STATUS_RU, translate } from '@shared/utils/locales';
import { DetailField, DetailModal, formatDateTime } from './adminModal.shared';

interface VendorDetailModalProps {
  selectedVendor: AdminVendor;
  setSelectedVendor: Dispatch<SetStateAction<AdminVendor | null>>;
  vendorDetailsLoading: boolean;
  approveLoading: boolean;
  handleApproveVendor: (vendorId: string) => void;
  handleRejectVendor: (vendorId: string) => void;
  handleDeleteVendor: (vendorId: string) => void;
}

export const VendorDetailModal = ({
  selectedVendor,
  setSelectedVendor,
  vendorDetailsLoading,
  approveLoading,
  handleApproveVendor,
  handleRejectVendor,
  handleDeleteVendor,
}: VendorDetailModalProps) => (
  <DetailModal
    title={selectedVendor.name || 'Вендор'}
    subtitle="Детали вендора"
    loading={vendorDetailsLoading}
    onClose={() => { setSelectedVendor(null); }}
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
          onClick={() => { handleApproveVendor(selectedVendor.id); }}
        >
          <CheckCircleIcon size={16} />
          {approveLoading ? 'Одобрение...' : 'Одобрить'}
        </button>
      )}
      {selectedVendor.approval_status !== 'REJECTED' && (
        <button
          className="btn btn-secondary"
          disabled={approveLoading}
          onClick={() => { handleRejectVendor(selectedVendor.id); }}
          style={{ color: 'var(--error)' }}
        >
          <ProhibitIcon size={16} />
          Отклонить
        </button>
      )}
    </div>
    <button
      className="btn btn-secondary"
      style={{ marginTop: 16, color: 'var(--error)' }}
      onClick={() => { handleDeleteVendor(selectedVendor.id); }}
    >
      <TrashIcon size={16} />
      Удалить вендора
    </button>
  </DetailModal>
);
