import { BatchActionBar } from '../../../components/BatchActionBar/BatchActionBar';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { useAdminDashboard } from '../useAdminDashboard';

interface AdminBatchBarsProps {
  dashboard: ReturnType<typeof useAdminDashboard>;
}

export function AdminBatchBars({ dashboard }: AdminBatchBarsProps) {
  const { t } = useTranslation();
  return (
    <>
      <BatchActionBar
        count={dashboard.selectedUserIds.size}
        label={t('admin.batch.labels.users')}
        loading={dashboard.batchLoading}
        onClear={() => { dashboard.setSelectedUserIds(new Set()); }}
        actions={[
          { label: t('admin.batch.actions.activate'), color: 'var(--color-success)', onClick: () => { dashboard.handleBatchUsers('activate'); } },
          { label: t('admin.batch.actions.deactivate'), color: 'var(--error)', onClick: () => { dashboard.handleBatchUsers('deactivate'); } },
        ]}
      />

      <BatchActionBar
        count={dashboard.selectedReviewIds.size}
        label={t('admin.batch.labels.reviews')}
        loading={dashboard.batchLoading}
        onClear={() => { dashboard.setSelectedReviewIds(new Set()); }}
        actions={[
          { label: t('admin.batch.actions.deleteSelected'), color: 'var(--error)', onClick: dashboard.handleBatchDeleteReviews },
        ]}
      />

      <BatchActionBar
        count={dashboard.selectedVendorIds.size}
        label={t('admin.batch.labels.vendors')}
        loading={dashboard.batchLoading}
        onClear={() => { dashboard.setSelectedVendorIds(new Set()); }}
        actions={[
          { label: t('admin.batch.actions.approveSelected'), color: 'var(--color-success)', onClick: () => { void dashboard.handleBatchVendors('approve'); } },
          { label: t('admin.batch.actions.rejectSelected'), color: 'var(--error)', onClick: () => { dashboard.requestReason({ title: t('admin.vendors.dialogs.rejectReasonTitle'), confirmLabel: t('common.actions.reject'), onConfirm: (reason) => dashboard.handleBatchVendors('reject', reason) }); } },
        ]}
      />

      <BatchActionBar
        count={dashboard.selectedRestaurantIds.size}
        label={t('admin.batch.labels.restaurants')}
        loading={dashboard.batchLoading}
        onClear={() => { dashboard.setSelectedRestaurantIds(new Set()); }}
        actions={[
          { label: t('admin.batch.actions.approveSelected'), color: 'var(--color-success)', onClick: () => { void dashboard.handleBatchRestaurants('approve'); } },
          { label: t('admin.batch.actions.rejectSelected'), color: 'var(--error)', onClick: () => { dashboard.requestReason({ title: t('admin.restaurants.dialogs.rejectReasonTitle'), confirmLabel: t('common.actions.reject'), onConfirm: (reason) => dashboard.handleBatchRestaurants('reject', reason) }); } },
        ]}
      />
    </>
  );
}
