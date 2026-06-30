import {
  RevenueChart,
  HourlyLoadChart,
  CategoryRevenueChart,
  AOVDynamicsChart,
  KPICards,
  TopItemsChart,
  TopRestaurantsChart,
} from '../../../components/dashboard/DashboardCharts';
import { CATEGORY_RU, translate } from '../../../utils/locales';

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
  fontSize: '0.86rem',
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

export default function AdminFinanceTab({
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
}) {
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
            setFinanceFilters({ ...financeFilters, restaurant_id: e.target.value })
          }
          style={selectFilterStyle}
        >
          <option value="">Все рестораны</option>
          {allRestaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20 }}>
        {[
          { label: 'Сегодня', days: 0 },
          { label: '3 дня', days: 3 },
          { label: '7 дней', days: 7 },
          { label: '30 дней', days: 30 },
          { label: 'Полгода', days: 180 },
          { label: 'Год', days: 365 },
          { label: 'Сбросить', days: null },
        ].map((preset) => (
          <button
            key={preset.label}
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
                const fmt = (d) => {
                  const m = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  return `${d.getFullYear()}-${m}-${day}`;
                };
                setFinanceFilters((prev) => ({
                  ...prev,
                  date_from: fmt(from),
                  date_to: fmt(to),
                }));
              }
            }}
          >
            {preset.label}
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
            handleExport(
              () =>
                adminService.exportFinancePDF({
                  date_from: financeFilters.date_from || undefined,
                  date_to: financeFilters.date_to || undefined,
                  restaurant_id: financeFilters.restaurant_id || undefined,
                }),
              `финансы_${getRestaurantLabel()}_${getDateRangeLabel()}.pdf`
            )
          }
        >
          {exportLoading ? '...' : '↓ Финансы PDF'}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exportLoading}
          onClick={() =>
            handleExport(
              () =>
                adminService.exportAnalyticsPDF({
                  date_from: financeFilters.date_from || undefined,
                  date_to: financeFilters.date_to || undefined,
                }),
              `аналитика_${getRestaurantLabel()}_${getDateRangeLabel()}.pdf`
            )
          }
        >
          {exportLoading ? '...' : '↓ Аналитика PDF'}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exportLoading}
          onClick={() =>
            handleExport(
              () =>
                adminService.exportOverviewPDF({
                  date_from: financeFilters.date_from || undefined,
                  date_to: financeFilters.date_to || undefined,
                }),
              `обзор_платформы_${todayStr}.pdf`
            )
          }
        >
          {exportLoading ? '...' : '↓ Обзор платформы PDF'}
        </button>
      </div>

      {financeLoading && !finance && <AnalyticsSkeleton />}
      {finance && (
        <>
          <KPICards finance={finance} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <RevenueChart data={finance.revenue_by_day || []} />
            {advancedAnalytics && (
              <AOVDynamicsChart data={advancedAnalytics.aov_dynamics || []} />
            )}
            <TopItemsChart data={finance.top_items || []} />
            {advancedAnalytics && (
              <CategoryRevenueChart
                data={(advancedAnalytics.category_revenue || []).map((item) => ({
                  ...item,
                  label: translate(CATEGORY_RU, item.label),
                }))}
              />
            )}
            {advancedAnalytics && (
              <HourlyLoadChart data={advancedAnalytics.hourly_load || []} />
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
                  fontSize: '0.85rem',
                  color: 'var(--text-2)',
                }}
              >
                <span>Топ ресторанов скрыт — активен фильтр по ресторану</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setFinanceFilters((prev) => ({ ...prev, restaurant_id: '' }))
                  }
                >
                  Сбросить фильтр
                </button>
              </div>
            ) : (
              <TopRestaurantsChart data={finance.top_restaurants || []} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
