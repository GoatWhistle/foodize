import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AdminRestaurantsTab } from '../../../../pages/admin/tabs/AdminRestaurantsTab';
import type { AdminRestaurant, RestaurantFilters } from '../../../../pages/admin/hooks/useAdminRestaurants';
import type { adminService as adminServiceType } from '../../../../services/adminService';

vi.mock('../../../../pages/admin/components/AdminRestaurantsFilters', () => ({
  AdminRestaurantsFilters: () => <div data-testid="filters" />,
}));

vi.mock('../../../../pages/admin/components/AdminRestaurantRow', () => ({
  AdminRestaurantRow: ({ restaurant }: { restaurant: AdminRestaurant }) => (
    <div data-testid={`row-${restaurant.id}`}>{restaurant.name}</div>
  ),
}));

const FILTERS: RestaurantFilters = { is_open: '', moderation_status: '', min_rating: '' };

const makeRestaurant = (id: string, name: string): AdminRestaurant =>
  ({ id, name }) as unknown as AdminRestaurant;

const adminService = {
  exportRestaurantsCSV: vi.fn().mockResolvedValue(new Blob()),
} as unknown as typeof adminServiceType;

const baseProps = {
  restaurants: [makeRestaurant('a', 'Alpha'), makeRestaurant('b', 'Beta')],
  restaurantsLoading: false,
  restaurantsTotal: 2,
  restaurantsPage: 1,
  setRestaurantsPage: vi.fn(),
  restaurantSearchRaw: '',
  setRestaurantSearchRaw: vi.fn(),
  restaurantVendorSearchRaw: '',
  setRestaurantVendorSearchRaw: vi.fn(),
  restaurantFilters: FILTERS,
  setRestaurantFilters: vi.fn(),
  selectedRestaurantIds: new Set<string>(),
  setSelectedRestaurantIds: vi.fn(),
  exportLoading: false,
  handleExport: vi.fn(),
  loadRestaurantDetails: vi.fn(),
  todayStr: '2026-07-19',
  adminService,
  PAGE_SIZE: 20,
};

describe('AdminRestaurantsTab', () => {
  it('renders skeletons while loading with no data', () => {
    const { container } = render(
      <AdminRestaurantsTab {...baseProps} restaurants={[]} restaurantsLoading restaurantsTotal={0} />
    );
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('filters')).toBeNull();
  });

  it('renders rows for each restaurant', () => {
    render(<AdminRestaurantsTab {...baseProps} />);
    expect(screen.getByTestId('row-a')).toHaveTextContent('Alpha');
    expect(screen.getByTestId('row-b')).toHaveTextContent('Beta');
  });

  it('shows empty state when array is empty (not loading)', () => {
    render(
      <AdminRestaurantsTab {...baseProps} restaurants={[]} restaurantsTotal={0} />
    );
    expect(screen.getByText('Ресторанов пока нет')).toBeInTheDocument();
  });

  it('renders skeletons for non-array restaurants while loading', () => {
    const { container } = render(
      <AdminRestaurantsTab
        {...baseProps}
        restaurants={undefined as unknown as AdminRestaurant[]}
        restaurantsLoading
        restaurantsTotal={0}
      />
    );
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('selects all restaurants when checkbox is checked', async () => {
    const user = userEvent.setup();
    const setSelectedRestaurantIds = vi.fn();
    render(
      <AdminRestaurantsTab {...baseProps} setSelectedRestaurantIds={setSelectedRestaurantIds} />
    );
    await user.click(screen.getByRole('checkbox'));
    expect(setSelectedRestaurantIds).toHaveBeenCalledWith(new Set(['a', 'b']));
  });

  it('clears selection when checkbox is unchecked', async () => {
    const user = userEvent.setup();
    const setSelectedRestaurantIds = vi.fn();
    render(
      <AdminRestaurantsTab
        {...baseProps}
        selectedRestaurantIds={new Set(['a', 'b'])}
        setSelectedRestaurantIds={setSelectedRestaurantIds}
      />
    );
    await user.click(screen.getByRole('checkbox'));
    expect(setSelectedRestaurantIds).toHaveBeenCalledWith(new Set());
  });

  it('exports CSV on button click', async () => {
    const user = userEvent.setup();
    const handleExport = vi.fn();
    render(<AdminRestaurantsTab {...baseProps} handleExport={handleExport} />);
    await user.click(screen.getByRole('button', { name: /CSV/ }));
    expect(handleExport).toHaveBeenCalledWith(
      adminService.exportRestaurantsCSV,
      'рестораны_2026-07-19.csv'
    );
  });

  it('disables export button and shows ellipsis while exporting', () => {
    render(<AdminRestaurantsTab {...baseProps} exportLoading />);
    const exportBtn = screen.getByRole('button', { name: '...' });
    expect(exportBtn).toBeDisabled();
  });
});
