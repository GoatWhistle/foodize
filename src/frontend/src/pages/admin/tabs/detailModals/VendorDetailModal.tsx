import type { Dispatch, SetStateAction } from 'react';
import { TrashIcon, CheckCircleIcon, ProhibitIcon } from '@phosphor-icons/react';
import type { AdminVendor } from '@shared/types/models';
import { approvalStatusLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';
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
}: VendorDetailModalProps) => {
  const { t } = useTranslation();
  return (
  <DetailModal
    title={selectedVendor.name || t('admin.vendors.modal.fallbackTitle')}
    subtitle={t('admin.vendors.modal.subtitle')}
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
      <DetailField label={t('admin.vendors.modal.fields.profileId')} mono>{selectedVendor.id}</DetailField>
      <DetailField label={t('admin.vendors.modal.fields.userId')} mono>{selectedVendor.user_id}</DetailField>
      <DetailField label={t('common.labels.name')}>{selectedVendor.name}</DetailField>
      <DetailField label={t('common.labels.phone')}>{selectedVendor.phone_number}</DetailField>
      <DetailField label={t('admin.vendors.modal.fields.restaurants')}>{selectedVendor.restaurants_count}</DetailField>
      <DetailField label={t('admin.vendors.modal.fields.moderation')}>
        <span className="order-status-badge pending">
          {approvalStatusLabel(selectedVendor.approval_status)}
        </span>
      </DetailField>
      <DetailField label={t('common.labels.createdAt')}>{formatDateTime(selectedVendor.created_at)}</DetailField>
    </div>
    {selectedVendor.rejection_reason && (
      <div style={{ marginTop: 10 }}>
        <DetailField label={t('common.labels.reason')}>
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
          {approveLoading ? t('common.actions.approving') : t('common.actions.approve')}
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
          {t('common.actions.reject')}
        </button>
      )}
    </div>
    <button
      className="btn btn-secondary"
      style={{ marginTop: 16, color: 'var(--error)' }}
      onClick={() => { handleDeleteVendor(selectedVendor.id); }}
    >
      <TrashIcon size={16} />
      {t('admin.vendors.modal.deleteVendor')}
    </button>
  </DetailModal>
  );
};
