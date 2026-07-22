import type { Dispatch, SetStateAction } from 'react';
import { DownloadSimpleIcon } from '@phosphor-icons/react';
import { Pagination } from '@shared/components/Pagination/Pagination';
import { EmptyState } from '@shared/components/EmptyState/EmptyState';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { adminService as adminServiceType } from '../../../services/adminService';
import type { AdminRestaurant, RestaurantFilters } from '../hooks/useAdminRestaurants';
import { AdminRestaurantsFilters } from '../components/AdminRestaurantsFilters';
import { AdminRestaurantRow } from '../components/AdminRestaurantRow';

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
  handleExport: (exportFn: () => Promise<Blob>, filename: string) => void;
  loadRestaurantDetails: (id: string) => void;
  todayStr: string;
  adminService: typeof adminServiceType;
  PAGE_SIZE: number;
}

export function AdminRestaurantsTab({
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
  const { t } = useTranslation();
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
      <AdminRestaurantsFilters
        restaurantSearchRaw={restaurantSearchRaw}
        setRestaurantSearchRaw={setRestaurantSearchRaw}
        restaurantVendorSearchRaw={restaurantVendorSearchRaw}
        setRestaurantVendorSearchRaw={setRestaurantVendorSearchRaw}
        restaurantFilters={restaurantFilters}
        setRestaurantFilters={setRestaurantFilters}
        setRestaurantsPage={setRestaurantsPage}
      />

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
            fontSize: "var(--text-base)",
            color: 'var(--text-3)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={restaurants.length > 0 && selectedRestaurantIds.size === restaurants.length}
            onChange={(e) =>
              { setSelectedRestaurantIds(
                e.target.checked ? new Set(restaurants.map((r) => r.id)) : new Set()
              ); }
            }
          />
          {t('admin.common.selectAll')}
        </label>
        <button
          className="btn btn-secondary btn-sm"
          disabled={exportLoading}
          onClick={() =>
            { handleExport(adminService.exportRestaurantsCSV, t('admin.exportFiles.restaurants', { date: todayStr })); }
          }
        >
          {exportLoading ? '...' : <><DownloadSimpleIcon size={16} weight="bold" /> CSV</>}
        </button>
      </div>

      {restaurants.map((restaurant) => (
        <AdminRestaurantRow
          key={restaurant.id}
          restaurant={restaurant}
          selectedRestaurantIds={selectedRestaurantIds}
          setSelectedRestaurantIds={setSelectedRestaurantIds}
          loadRestaurantDetails={loadRestaurantDetails}
        />
      ))}

      {isEmpty && (
        <EmptyState
          title={t('admin.restaurants.emptyTitle')}
          subtitle={t('admin.common.emptySubtitle')}
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
