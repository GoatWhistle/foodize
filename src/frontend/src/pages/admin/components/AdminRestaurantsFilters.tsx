import type { Dispatch, SetStateAction } from 'react';
import { approvalStatusLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { RestaurantFilters } from '../hooks/useAdminRestaurants';

const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

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
  fontSize: "var(--text-base)",
  lineHeight: 1.2,
};

const selectFilterStyle = {
  ...filterControlStyle,
  paddingRight: 34,
  backgroundPosition: 'right 10px center',
};

interface AdminRestaurantsFiltersProps {
  restaurantSearchRaw: string;
  setRestaurantSearchRaw: Dispatch<SetStateAction<string>>;
  restaurantVendorSearchRaw: string;
  setRestaurantVendorSearchRaw: Dispatch<SetStateAction<string>>;
  restaurantFilters: RestaurantFilters;
  setRestaurantFilters: Dispatch<SetStateAction<RestaurantFilters>>;
  setRestaurantsPage: Dispatch<SetStateAction<number>>;
}

export function AdminRestaurantsFilters({
  restaurantSearchRaw,
  setRestaurantSearchRaw,
  restaurantVendorSearchRaw,
  setRestaurantVendorSearchRaw,
  restaurantFilters,
  setRestaurantFilters,
  setRestaurantsPage,
}: AdminRestaurantsFiltersProps) {
  const { t } = useTranslation();
  return (
    <div style={filterGridStyle}>
      <input
        className="form-input"
        style={filterControlStyle}
        placeholder={t('admin.restaurants.filters.restaurantPlaceholder')}
        value={restaurantSearchRaw}
        onChange={(event) => {
          setRestaurantsPage(1);
          setRestaurantSearchRaw(event.target.value);
        }}
      />
      <input
        className="form-input"
        style={filterControlStyle}
        placeholder={t('admin.restaurants.filters.vendorPlaceholder')}
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
        <option value="">{t('admin.common.anyStatus')}</option>
        <option value="true">{t('admin.restaurants.filters.open')}</option>
        <option value="false">{t('admin.restaurants.filters.closed')}</option>
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
        <option value="">{t('admin.restaurants.filters.moderation')}</option>
        {APPROVAL_STATUSES.map((status) => (
          <option key={status} value={status}>
            {approvalStatusLabel(status)}
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
        <option value="">{t('admin.restaurants.filters.anyRating')}</option>
        <option value="4">{t('admin.restaurants.filters.ratingFrom4')}</option>
        <option value="3">{t('admin.restaurants.filters.ratingFrom3')}</option>
        <option value="2">{t('admin.restaurants.filters.ratingFrom2')}</option>
      </select>
    </div>
  );
}
