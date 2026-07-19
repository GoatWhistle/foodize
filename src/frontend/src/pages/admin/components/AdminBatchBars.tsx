import { BatchActionBar } from '../../../components/BatchActionBar/BatchActionBar';
import type { useAdminDashboard } from '../useAdminDashboard';

interface AdminBatchBarsProps {
  dashboard: ReturnType<typeof useAdminDashboard>;
}

export function AdminBatchBars({ dashboard }: AdminBatchBarsProps) {
  return (
    <>
      <BatchActionBar
        count={dashboard.selectedUserIds.size}
        label="пользователей"
        loading={dashboard.batchLoading}
        onClear={() => { dashboard.setSelectedUserIds(new Set()); }}
        actions={[
          { label: 'Активировать', color: 'var(--color-success)', onClick: () => { dashboard.handleBatchUsers('activate'); } },
          { label: 'Деактивировать', color: 'var(--error)', onClick: () => { dashboard.handleBatchUsers('deactivate'); } },
        ]}
      />

      <BatchActionBar
        count={dashboard.selectedReviewIds.size}
        label="отзывов"
        loading={dashboard.batchLoading}
        onClear={() => { dashboard.setSelectedReviewIds(new Set()); }}
        actions={[
          { label: 'Удалить выбранные', color: 'var(--error)', onClick: dashboard.handleBatchDeleteReviews },
        ]}
      />

      <BatchActionBar
        count={dashboard.selectedVendorIds.size}
        label="вендоров"
        loading={dashboard.batchLoading}
        onClear={() => { dashboard.setSelectedVendorIds(new Set()); }}
        actions={[
          { label: 'Одобрить выбранных', color: 'var(--color-success)', onClick: () => { void dashboard.handleBatchVendors('approve'); } },
          { label: 'Отклонить выбранных', color: 'var(--error)', onClick: () => { dashboard.requestReason({ title: 'Причина отклонения', confirmLabel: 'Отклонить', onConfirm: (reason) => dashboard.handleBatchVendors('reject', reason) }); } },
        ]}
      />

      <BatchActionBar
        count={dashboard.selectedRestaurantIds.size}
        label="ресторанов"
        loading={dashboard.batchLoading}
        onClear={() => { dashboard.setSelectedRestaurantIds(new Set()); }}
        actions={[
          { label: 'Одобрить выбранных', color: 'var(--color-success)', onClick: () => { void dashboard.handleBatchRestaurants('approve'); } },
          { label: 'Отклонить выбранных', color: 'var(--error)', onClick: () => { dashboard.requestReason({ title: 'Причина отклонения', confirmLabel: 'Отклонить', onConfirm: (reason) => dashboard.handleBatchRestaurants('reject', reason) }); } },
        ]}
      />
    </>
  );
}
