import BatchActionBar from '../../../components/BatchActionBar/BatchActionBar';
import type { useAdminDashboard } from '../useAdminDashboard';

interface AdminBatchBarsProps {
  d: ReturnType<typeof useAdminDashboard>;
}

export function AdminBatchBars({ d }: AdminBatchBarsProps) {
  return (
    <>
      <BatchActionBar
        count={d.selectedUserIds.size}
        label="пользователей"
        loading={d.batchLoading}
        onClear={() => d.setSelectedUserIds(new Set())}
        actions={[
          { label: 'Активировать', color: 'var(--color-success)', onClick: () => d.handleBatchUsers('activate') },
          { label: 'Деактивировать', color: 'var(--error)', onClick: () => d.handleBatchUsers('deactivate') },
        ]}
      />

      <BatchActionBar
        count={d.selectedReviewIds.size}
        label="отзывов"
        loading={d.batchLoading}
        onClear={() => d.setSelectedReviewIds(new Set())}
        actions={[
          { label: 'Удалить выбранные', color: 'var(--error)', onClick: d.handleBatchDeleteReviews },
        ]}
      />

      <BatchActionBar
        count={d.selectedVendorIds.size}
        label="вендоров"
        loading={d.batchLoading}
        onClear={() => d.setSelectedVendorIds(new Set())}
        actions={[
          { label: 'Одобрить выбранных', color: 'var(--color-success)', onClick: () => { void d.handleBatchVendors('approve'); } },
          { label: 'Отклонить выбранных', color: 'var(--error)', onClick: () => d.requestReason({ title: 'Причина отклонения', confirmLabel: 'Отклонить', onConfirm: (reason) => d.handleBatchVendors('reject', reason) }) },
        ]}
      />

      <BatchActionBar
        count={d.selectedRestaurantIds.size}
        label="ресторанов"
        loading={d.batchLoading}
        onClear={() => d.setSelectedRestaurantIds(new Set())}
        actions={[
          { label: 'Одобрить выбранных', color: 'var(--color-success)', onClick: () => { void d.handleBatchRestaurants('approve'); } },
          { label: 'Отклонить выбранных', color: 'var(--error)', onClick: () => d.requestReason({ title: 'Причина отклонения', confirmLabel: 'Отклонить', onConfirm: (reason) => d.handleBatchRestaurants('reject', reason) }) },
        ]}
      />
    </>
  );
}
