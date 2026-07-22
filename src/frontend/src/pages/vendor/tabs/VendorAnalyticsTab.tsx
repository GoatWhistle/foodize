import type { Dispatch, SetStateAction } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import {
  RevenueChart,
  HourlyLoadChart,
  CategoryRevenueChart,
  AOVDynamicsChart,
  KPICards,
  TopItemsChart,
  OrderStatusPieChart,
} from '../../../components/dashboard/DashboardCharts';
import { categoryLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';
import { vendorService } from '@shared/services/vendorService';
import type {
  AdvancedAnalytics,
  AnalyticsPoint,
  FinanceAnalytics,
  Restaurant,
} from '@shared/types/models';
import type { FinanceFilters } from '../hooks/useVendorFinance';

interface VendorAnalyticsTabProps {
  finance: FinanceAnalytics | null;
  financeLoading: boolean;
  advancedAnalytics: AdvancedAnalytics | null;
  analyticsLoading: boolean;
  financeFilters: FinanceFilters;
  setFinanceFilters: Dispatch<SetStateAction<FinanceFilters>>;
  activePreset: number | null;
  setActivePreset: Dispatch<SetStateAction<number | null>>;
  exportLoading: boolean;
  handleVendorExport: (
    exportFn: () => Promise<Blob>,
    filename: string
  ) => void;
  vendorService: typeof vendorService;
  selectedRestaurant: Restaurant | null;
  getVendorRestaurantLabel: () => string;
  getVendorDateRange: () => string;
}

const AnalyticsSkeleton = () => (
  <div style={{ display: 'grid', gap: 16 }}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
      }}
    >
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="skeleton"
          style={{ height: 88, borderRadius: 'var(--radius-md)' }}
        />
      ))}
    </div>
    <div className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-md)' }} />
  </div>
);

export function VendorAnalyticsTab({
  finance,
  financeLoading,
  advancedAnalytics,
  analyticsLoading,
  financeFilters,
  setFinanceFilters,
  activePreset,
  setActivePreset,
  exportLoading,
  handleVendorExport,
  vendorService,
  selectedRestaurant,
  getVendorRestaurantLabel,
  getVendorDateRange,
}: VendorAnalyticsTabProps) {
  const { t } = useTranslation();
  return (
    <div
      className={financeLoading || analyticsLoading ? 'loading-dim' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <input
          className="form-input"
          type="date"
          value={financeFilters.date_from}
          onChange={(e) => {
            setActivePreset(null);
            setFinanceFilters((f) => ({ ...f, date_from: e.target.value }));
          }}
        />
        <input
          className="form-input"
          type="date"
          value={financeFilters.date_to}
          onChange={(e) => {
            setActivePreset(null);
            setFinanceFilters((f) => ({ ...f, date_to: e.target.value }));
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          marginBottom: 20,
        }}
      >
        {[
          { labelKey: 'vendor.analytics.presets.today', days: 0 },
          { labelKey: 'vendor.analytics.presets.days3', days: 3 },
          { labelKey: 'vendor.analytics.presets.days7', days: 7 },
          { labelKey: 'vendor.analytics.presets.days30', days: 30 },
          { labelKey: 'vendor.analytics.presets.halfYear', days: 180 },
          { labelKey: 'vendor.analytics.presets.year', days: 365 },
          { labelKey: 'vendor.analytics.presets.reset', days: null },
        ].map((preset) => (
          <button
            key={preset.labelKey}
            className={`btn btn-sm ${activePreset === preset.days ? 'btn-primary' : 'btn-secondary'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => {
              setActivePreset(preset.days);
              if (preset.days === null) {
                setFinanceFilters((prev) => ({ ...prev, date_from: '', date_to: '' }));
              } else {
                const to = new Date();
                const from = new Date();
                from.setDate(to.getDate() - preset.days);
                const fmt = (date: Date) => {
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `${date.getFullYear()}-${month}-${day}`;
                };
                setFinanceFilters((prev) => ({
                  ...prev,
                  date_from: fmt(from),
                  date_to: fmt(to),
                }));
              }
            }}
          >
            {t(preset.labelKey)}
          </button>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-end',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <button
          className="btn btn-secondary btn-sm"
          disabled={exportLoading}
          onClick={() =>
            { handleVendorExport(
              () =>
                vendorService.exportFinancePDF({
                  date_from: financeFilters.date_from || undefined,
                  date_to: financeFilters.date_to || undefined,
                  restaurant_id: selectedRestaurant?.id || undefined,
                }),
              t('vendor.exportFiles.finance', { restaurant: getVendorRestaurantLabel(), range: getVendorDateRange() })
            ); }
          }
        >
          {exportLoading ? '...' : <><DownloadSimpleIcon size={16} weight="bold" /> {t('vendor.analytics.financePdf')}</>}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exportLoading}
          onClick={() =>
            { handleVendorExport(
              () =>
                vendorService.exportAnalyticsPDF({
                  date_from: financeFilters.date_from || undefined,
                  date_to: financeFilters.date_to || undefined,
                  restaurant_id: selectedRestaurant?.id || undefined,
                }),
              t('vendor.exportFiles.analytics', { restaurant: getVendorRestaurantLabel(), range: getVendorDateRange() })
            ); }
          }
        >
          {exportLoading ? '...' : <><DownloadSimpleIcon size={16} weight="bold" /> {t('vendor.analytics.analyticsPdf')}</>}
        </button>
      </div>
      {financeLoading && !finance && <AnalyticsSkeleton />}
      {finance && <KPICards finance={finance} />}
      {finance && <RevenueChart data={finance.revenue_by_day} />}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: 20,
          marginTop: 20,
        }}
      >
        {finance && (
          <>
            <OrderStatusPieChart
              data={{
                [t('vendor.analytics.orderStatus.completed')]: finance.completed_orders,
                [t('vendor.analytics.orderStatus.inProgress')]: Math.max(
                  0,
                  finance.total_orders - finance.completed_orders - finance.cancelled_orders
                ),
                [t('vendor.analytics.orderStatus.cancelled')]: finance.cancelled_orders,
              }}
            />
            <TopItemsChart data={finance.top_items} />
          </>
        )}
        {advancedAnalytics && (
          <>
            <HourlyLoadChart data={advancedAnalytics.hourly_load} />
            <CategoryRevenueChart
              data={advancedAnalytics.category_revenue.map((item: AnalyticsPoint) => ({
                ...item,
                label: categoryLabel(item.label),
              }))}
            />
            <AOVDynamicsChart data={advancedAnalytics.aov_dynamics} />
          </>
        )}
      </div>
    </div>
  );
}
