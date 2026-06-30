import { Monitor } from '@phosphor-icons/react';
import Pagination from '../../../components/ui/Pagination';
import EmptyState from '../../../components/ui/EmptyState';
import { APPROVAL_STATUS_RU, translate } from '../../../utils/locales';

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
};

const filterGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 8,
  alignItems: 'center',
};

const filterControlStyle = {
  minWidth: 0,
  height: 48,
  paddingTop: 11,
  paddingBottom: 11,
  fontSize: '0.86rem',
  lineHeight: 1.2,
};

const selectFilterStyle = {
  ...filterControlStyle,
  paddingRight: 34,
  backgroundPosition: 'right 10px center',
};

export default function AdminRestaurantsTab({
  restaurants,
  restaurantsLoading,
  restaurantsTotal,
  restaurantsPage,
  setRestaurantsPage,
  restaurantSearchRaw,
  setRestaurantSearchRaw,
  restaurantVendorSearchRaw,
  setRestaurantVendorSearchRaw,
  restaurantFilters,
  setRestaurantFilters,
  selectedRestaurantIds,
  setSelectedRestaurantIds,
  exportLoading,
  handleExport,
  loadRestaurantDetails,
  todayStr,
  adminService,
  PAGE_SIZE,
}) {
  const isEmpty = !Array.isArray(restaurants) || restaurants.length === 0;

  if (restaurantsLoading && isEmpty) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: 16,
            }}
          >
            <div className="skeleton" style={{ width: '30%', height: 16, marginBottom: 8, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={restaurantsLoading ? 'loading-dim' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={filterGridStyle}>
        <input
          className="form-input"
          style={filterControlStyle}
          placeholder="Ресторан"
          value={restaurantSearchRaw}
          onChange={(event) => {
            setRestaurantsPage(1);
            setRestaurantSearchRaw(event.target.value);
          }}
        />
        <input
          className="form-input"
          style={filterControlStyle}
          placeholder="Вендор или телефон"
          value={restaurantVendorSearchRaw}
          onChange={(event) => {
            setRestaurantsPage(1);
            setRestaurantVendorSearchRaw(event.target.value);
          }}
        />
        <select
          className="form-input"
          style={selectFilterStyle}
          value={restaurantFilters.is_open}
          onChange={(event) => {
            setRestaurantsPage(1);
            setRestaurantFilters((prev) => ({ ...prev, is_open: event.target.value }));
          }}
        >
          <option value="">Любой статус</option>
          <option value="true">Открыт</option>
          <option value="false">Закрыт</option>
        </select>
        <select
          className="form-input"
          style={selectFilterStyle}
          value={restaurantFilters.moderation_status}
          onChange={(event) => {
            setRestaurantsPage(1);
            setRestaurantFilters((prev) => ({ ...prev, moderation_status: event.target.value }));
          }}
        >
          <option value="">Модерация</option>
          {Object.entries(APPROVAL_STATUS_RU).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
        <select
          className="form-input"
          style={selectFilterStyle}
          value={restaurantFilters.min_rating}
          onChange={(event) => {
            setRestaurantsPage(1);
            setRestaurantFilters((prev) => ({ ...prev, min_rating: event.target.value }));
          }}
        >
          <option value="">Любой рейтинг</option>
          <option value="4">★ от 4</option>
          <option value="3">★ от 3</option>
          <option value="2">★ от 2</option>
        </select>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.82rem',
            color: 'var(--text-3)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={restaurants.length > 0 && selectedRestaurantIds.size === restaurants.length}
            onChange={(e) =>
              setSelectedRestaurantIds(
                e.target.checked ? new Set(restaurants.map((r) => r.id)) : new Set()
              )
            }
          />
          Выбрать все
        </label>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exportLoading}
          onClick={() =>
            handleExport(adminService.exportRestaurantsCSV, `рестораны_${todayStr}.csv`)
          }
        >
          {exportLoading ? '...' : '↓ CSV'}
        </button>
      </div>

      {restaurants.map((restaurant) => (
        <div key={restaurant.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={selectedRestaurantIds.has(restaurant.id)}
            onChange={(e) => {
              setSelectedRestaurantIds((prev) => {
                const next = new Set(prev);
                if (e.target.checked) next.add(restaurant.id);
                else next.delete(restaurant.id);
                return next;
              });
            }}
            style={{ flexShrink: 0 }}
          />
          <button
            type="button"
            onClick={() => loadRestaurantDetails(restaurant.id)}
            style={{
              ...cardStyle,
              padding: 16,
              flex: 1,
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div>
              <div style={{ color: 'var(--text-1)', fontWeight: 900 }}>{restaurant.name}</div>
              <div style={{ color: 'var(--text-3)', fontSize: '0.84rem', marginTop: 4 }}>
                {restaurant.address}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <span
                  className={`order-status-badge ${restaurant.is_open ? 'ready' : 'cancelled'}`}
                >
                  {restaurant.is_open ? 'Открыт' : 'Закрыт'}
                </span>
                <span
                  className={`order-status-badge ${restaurant.is_hiring ? 'pending' : 'cancelled'}`}
                >
                  {restaurant.is_hiring ? 'Нанимает' : 'Не нанимает'}
                </span>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 6,
              }}
            >
              <div style={{ color: 'var(--text-3)', fontSize: '0.82rem', textAlign: 'right' }}>
                {restaurant.orders_count || 0} заказов
                <br />★ {restaurant.average_rating || 0}
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(
                    `/display-board/${restaurant.id}`,
                    '_blank',
                    'noopener,noreferrer'
                  );
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--text-3)',
                  padding: '3px 7px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Monitor size={11} />
                Табло
              </div>
            </div>
          </button>
        </div>
      ))}

      {isEmpty && (
        <EmptyState
          title="Ресторанов пока нет"
          subtitle="Для выбранных фильтров нет результатов"
        />
      )}

      <Pagination
        page={restaurantsPage}
        totalPages={Math.ceil(restaurantsTotal / PAGE_SIZE)}
        onPageChange={setRestaurantsPage}
      />
    </div>
  );
}
