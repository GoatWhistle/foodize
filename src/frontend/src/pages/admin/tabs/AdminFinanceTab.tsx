import {
  RevenueChart,
  HourlyLoadChart,
  CategoryRevenueChart,
  AOVDynamicsChart,
  KPICards,
  TopItemsChart,
  TopRestaurantsChart,
} from '../../../components/dashboard/DashboardCharts';
import { categoryLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';
import { AdminFinanceToolbar } from './AdminFinanceToolbar';
import type { AdminFinanceToolbarProps } from './AdminFinanceToolbar';
import type { FinanceAnalytics, AdvancedAnalytics } from '../hooks/useAdminFinance';

interface AdminFinanceTabProps extends AdminFinanceToolbarProps {
  finance: FinanceAnalytics | null;
  financeLoading: boolean;
  advancedAnalytics: AdvancedAnalytics | null;
  analyticsLoading: boolean;
}

const AnalyticsSkeleton = () => (
  <div style={{ display: 'grid', gap: 16 }}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
      }}
    >
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="skeleton"
          style={{ height: 92, borderRadius: 'var(--radius-md)' }}
        />
      ))}
    </div>
    <div
      className="skeleton"
      style={{ height: 260, borderRadius: 'var(--radius-md)' }}
    />
  </div>
);

export function AdminFinanceTab({
  finance,
  financeLoading,
  advancedAnalytics,
  analyticsLoading,
  ...toolbarProps
}: AdminFinanceTabProps) {
  const { t } = useTranslation();
  const { financeFilters, setFinanceFilters } = toolbarProps;

  return (
    <div
      className={financeLoading || analyticsLoading ? 'loading-dim' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <AdminFinanceToolbar {...toolbarProps} />

      {financeLoading && !finance && <AnalyticsSkeleton />}
      {finance && (
        <>
          <KPICards finance={finance} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <RevenueChart data={finance.revenue_by_day} />
            {advancedAnalytics && (
              <AOVDynamicsChart data={advancedAnalytics.aov_dynamics} />
            )}
            <TopItemsChart data={finance.top_items} />
            {advancedAnalytics && (
              <CategoryRevenueChart
                data={advancedAnalytics.category_revenue.map((item) => ({
                  ...item,
                  label: categoryLabel(item.label),
                }))}
              />
            )}
            {advancedAnalytics && (
              <HourlyLoadChart data={advancedAnalytics.hourly_load} />
            )}
            {financeFilters.restaurant_id ? (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  fontSize: "var(--text-base)",
                  color: 'var(--text-2)',
                }}
              >
                <span>{t('admin.finance.topRestaurantsHidden')}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    { setFinanceFilters((prev) => ({ ...prev, restaurant_id: '' })); }
                  }
                >
                  {t('admin.finance.resetFilter')}
                </button>
              </div>
            ) : (
              <TopRestaurantsChart data={finance.top_restaurants} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
