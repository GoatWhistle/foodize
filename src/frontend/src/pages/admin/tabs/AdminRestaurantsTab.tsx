import type { Dispatch, SetStateAction } from 'react';
import { Monitor, Star, DownloadSimple } from '@phosphor-icons/react';
import Pagination from '@shared/components/Pagination/Pagination';
import EmptyState from '@shared/components/EmptyState/EmptyState';
import { APPROVAL_STATUS_RU } from '@shared/utils/locales';
import type { adminService as adminServiceType } from '../../../services/adminService';
import type { AdminRestaurant, RestaurantFilters } from '../hooks/useAdminRestaurants';

interface AdminRestaurantsTabProps {
  restaurants: AdminRestaurant[];
  restaurantsLoading: boolean;
  restaurantsTotal: number;
  restaurantsPage: number;
  setRestaurantsPage: Dispatch<SetStateAction<number>>;
  restaurantSearchRaw: string;
  setRestaurantSearchRaw: Dispatch<SetStateAction<string>>;
  restaurantVendorSearchRaw: string;
  setRestaurantVendorSearchRaw: Dispatch<SetStateAction<string>>;
  restaurantFilters: RestaurantFilters;
  setRestaurantFilters: Dispatch<SetStateAction<RestaurantFilters>>;
  selectedRestaurantIds: Set<string>;
  setSelectedRestaurantIds: Dispatch<SetStateAction<Set<string>>>;
  exportLoading: boolean;
  handleExport: (exportFn: () => Promise<{ data: Blob }>, filename: string) => void;
  loadRestaurantDetails: (id: string) => void;
  todayStr: string;
  adminService: typeof adminServiceType;
  PAGE_SIZE: number;
}

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
}: AdminRestaurantsTabProps) {
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
          <option value="4">от 4 звёзд</option>
          <option value="3">от 3 звёзд</option>
          <option value="2">от 2 звёзд</option>
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
          {exportLoading ? '...' : <><DownloadSimple size={16} weight="bold" /> CSV</>}
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
                <br />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Star size={14} weight="fill" color="var(--star)" /> {restaurant.average_rating || 0}
                </span>
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
