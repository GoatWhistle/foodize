import type { Dispatch, SetStateAction } from 'react';
import { APPROVAL_STATUS_RU } from '@shared/utils/locales';
import type { RestaurantFilters } from '../hooks/useAdminRestaurants';

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
  return (
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
  );
}
