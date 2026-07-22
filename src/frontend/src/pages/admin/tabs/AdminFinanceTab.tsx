import type { Dispatch, SetStateAction } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
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
import { presetToDateRange } from '@shared/utils/datetime';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { adminService as adminServiceType } from '../../../services/adminService';
import type {
  FinanceAnalytics,
  AdvancedAnalytics,
  AdminRestaurant,
  FinanceFilters,
} from '../hooks/useAdminFinance';

interface AdminFinanceTabProps {
  finance: FinanceAnalytics | null;
  financeLoading: boolean;
  advancedAnalytics: AdvancedAnalytics | null;
  analyticsLoading: boolean;
  financeFilters: FinanceFilters;
  setFinanceFilters: Dispatch<SetStateAction<FinanceFilters>>;
  activePreset: number | null;
  setActivePreset: Dispatch<SetStateAction<number | null>>;
  allRestaurants: AdminRestaurant[];
  exportLoading: boolean;
  handleExport: (exportFn: () => Promise<Blob>, filename: string) => void;
  todayStr: string;
  adminService: typeof adminServiceType;
  getRestaurantLabel: () => string;
  getDateRangeLabel: () => string;
}

const DATE_PRESETS: readonly { labelKey: string; days: number | null }[] = [
  { labelKey: 'admin.finance.presets.today', days: 0 },
  { labelKey: 'admin.finance.presets.days3', days: 3 },
  { labelKey: 'admin.finance.presets.days7', days: 7 },
  { labelKey: 'admin.finance.presets.days30', days: 30 },
  { labelKey: 'admin.finance.presets.halfYear', days: 180 },
  { labelKey: 'admin.finance.presets.year', days: 365 },
  { labelKey: 'admin.finance.presets.reset', days: null },
];

const filterGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 8,
  alignItems: 'center',
};

const selectFilterStyle = {
  minWidth: 0,
  height: 48,
  paddingTop: 11,
  paddingBottom: 11,
  fontSize: "var(--text-base)",
  lineHeight: 1.2,
  paddingRight: 34,
  backgroundPosition: 'right 10px center',
};

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
  financeFilters,
  setFinanceFilters,
  activePreset,
  setActivePreset,
  allRestaurants,
  exportLoading,
  handleExport,
  todayStr,
  adminService,
  getRestaurantLabel,
  getDateRangeLabel,
}: AdminFinanceTabProps) {
  const { t } = useTranslation();
  const dateRange = {
    date_from: financeFilters.date_from || undefined,
    date_to: financeFilters.date_to || undefined,
  };
  const exportActions: readonly {
    label: string;
    filename: string;
    exportFn: () => Promise<Blob>;
  }[] = [
    {
      label: t('admin.finance.exports.financePdf'),
      filename: t('admin.exportFiles.finance', { restaurant: getRestaurantLabel(), range: getDateRangeLabel() }),
      exportFn: () =>
        adminService.exportFinancePDF({
          ...dateRange,
          restaurant_id: financeFilters.restaurant_id || undefined,
        }),
    },
    {
      label: t('admin.finance.exports.analyticsPdf'),
      filename: t('admin.exportFiles.analytics', { restaurant: getRestaurantLabel(), range: getDateRangeLabel() }),
      exportFn: () => adminService.exportAnalyticsPDF(dateRange),
    },
    {
      label: t('admin.finance.exports.overviewPdf'),
      filename: t('admin.exportFiles.overview', { date: todayStr }),
      exportFn: () => adminService.exportOverviewPDF(dateRange),
    },
  ];

  return (
    <div
      className={financeLoading || analyticsLoading ? 'loading-dim' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ ...filterGridStyle, marginBottom: 12 }}>
        <input
          className="form-input"
          type="date"
          value={financeFilters.date_from}
          onChange={(e) => {
            setActivePreset(null);
            setFinanceFilters({ ...financeFilters, date_from: e.target.value });
          }}
        />
        <input
          className="form-input"
          type="date"
          value={financeFilters.date_to}
          onChange={(e) => {
            setActivePreset(null);
            setFinanceFilters({ ...financeFilters, date_to: e.target.value });
          }}
        />
        <select
          className="form-input"
          value={financeFilters.restaurant_id}
          onChange={(e) =>
            { setFinanceFilters({ ...financeFilters, restaurant_id: e.target.value }); }
          }
          style={selectFilterStyle}
        >
          <option value="">{t('admin.finance.allRestaurants')}</option>
          {allRestaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20 }}>
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.labelKey}
            className={`btn btn-sm ${activePreset === preset.days ? 'btn-primary' : 'btn-secondary'}`}
            style={{ whiteSpace: 'nowrap' }}
            onClick={() => {
              const presetDays = preset.days;
              setActivePreset(presetDays);
              if (presetDays === null) {
                setFinanceFilters((prev) => ({ ...prev, date_from: '', date_to: '' }));
              } else {
                setFinanceFilters((prev) => ({
                  ...prev,
                  ...presetToDateRange(presetDays),
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
        {exportActions.map((action) => (
          <button
            key={action.label}
            className="btn btn-secondary btn-sm"
            disabled={exportLoading}
            onClick={() => { handleExport(action.exportFn, action.filename); }}
          >
            {exportLoading ? '...' : <><DownloadSimpleIcon size={16} weight="bold" /> {action.label}</>}
          </button>
        ))}
      </div>

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
