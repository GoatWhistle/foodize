import type { Dispatch, SetStateAction } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { presetToDateRange } from '@shared/utils/datetime';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { adminService as adminServiceType } from '../../../services/adminService';
import type { AdminRestaurant, FinanceFilters } from '../hooks/useAdminFinance';

export interface AdminFinanceToolbarProps {
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

export function AdminFinanceToolbar({
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
}: AdminFinanceToolbarProps) {
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
    <>
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
    </>
  );
}
