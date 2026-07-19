import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { AdminRestaurantsFilters } from '../../../../pages/admin/components/AdminRestaurantsFilters';
import type { RestaurantFilters } from '../../../../pages/admin/hooks/useAdminRestaurants';
import { at } from '../../../testUtils';

const baseFilters: RestaurantFilters = { is_open: '', moderation_status: '', min_rating: '' };

const setup = () => {
  const setRestaurantSearchRaw = vi.fn();
  const setRestaurantVendorSearchRaw = vi.fn();
  const setRestaurantsPage = vi.fn();
  const onFilters = vi.fn();

  const Harness = () => {
    const [filters, setFilters] = useState<RestaurantFilters>(baseFilters);
    return (
      <AdminRestaurantsFilters
        restaurantSearchRaw=""
        setRestaurantSearchRaw={setRestaurantSearchRaw}
        restaurantVendorSearchRaw=""
        setRestaurantVendorSearchRaw={setRestaurantVendorSearchRaw}
        restaurantFilters={filters}
        setRestaurantFilters={(u) => {
          setFilters((prev) => {
            const next = typeof u === 'function' ? u(prev) : u;
            onFilters(next);
            return next;
          });
        }}
        setRestaurantsPage={setRestaurantsPage}
      />
    );
  };

  render(<Harness />);
  return { setRestaurantSearchRaw, setRestaurantVendorSearchRaw, setRestaurantsPage, onFilters };
};

describe('AdminRestaurantsFilters', () => {
  it('typing restaurant search resets page and updates value', async () => {
    const { setRestaurantSearchRaw, setRestaurantsPage } = setup();
    await userEvent.type(screen.getByPlaceholderText('Ресторан'), 'a');
    expect(setRestaurantsPage).toHaveBeenCalledWith(1);
    expect(setRestaurantSearchRaw).toHaveBeenCalledWith('a');
  });

  it('typing vendor search updates value', async () => {
    const { setRestaurantVendorSearchRaw } = setup();
    await userEvent.type(screen.getByPlaceholderText('Вендор или телефон'), 'b');
    expect(setRestaurantVendorSearchRaw).toHaveBeenCalledWith('b');
  });

  it('changing is_open select updates filters', async () => {
    const { onFilters, setRestaurantsPage } = setup();
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(at(selects, 0), 'true');
    expect(setRestaurantsPage).toHaveBeenCalledWith(1);
    expect(onFilters).toHaveBeenLastCalledWith({ ...baseFilters, is_open: 'true' });
  });

  it('changing moderation select updates filters', async () => {
    const { onFilters } = setup();
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(at(selects, 1), 'APPROVED');
    expect(onFilters).toHaveBeenLastCalledWith({ ...baseFilters, moderation_status: 'APPROVED' });
  });

  it('changing rating select updates filters', async () => {
    const { onFilters } = setup();
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(at(selects, 2), '4');
    expect(onFilters).toHaveBeenLastCalledWith({ ...baseFilters, min_rating: '4' });
  });
});
