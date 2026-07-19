import type { FormEvent } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { VendorRestaurantList } from '../../../pages/vendor/VendorRestaurantList';
import type { Restaurant } from '@shared/types/models';
import type { NewRestaurantForm, VendorProfile } from '../../../pages/vendor/hooks/useVendorRestaurants';

const restaurants = [
  { id: 'r1', name: 'Alpha', address: 'A st', display_id: 'alpha', moderation_status: 'PENDING' },
  { id: 'r2', name: 'Beta', address: 'B st', moderation_status: 'REJECTED' },
  { id: 'r3', name: 'Gamma', address: 'G st', moderation_status: 'APPROVED' },
] as unknown as Restaurant[];

const emptyForm: NewRestaurantForm = {
  name: '',
  address: '',
  avg_prep_time_minutes: '',
  max_active_orders: '',
};

const setup = (overrides: Partial<Parameters<typeof VendorRestaurantList>[0]> = {}) => {
  const props = {
    restaurants,
    loading: false,
    selectedRestaurant: null as Restaurant | null,
    setSelectedRestaurant: vi.fn(),
    vendorProfile: { approval_status: 'APPROVED' } as unknown as VendorProfile,
    showAddRestaurant: false,
    setShowAddRestaurant: vi.fn(),
    newRestaurant: emptyForm,
    setNewRestaurant: vi.fn(),
    formError: '',
    formLoading: false,
    handleCreateRestaurant: vi.fn((e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
    }),
    ...overrides,
  };
  render(<VendorRestaurantList {...props} />);
  return props;
};

describe('VendorRestaurantList', () => {
  it('renders restaurant rows with badges', () => {
    setup();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('@alpha')).toBeInTheDocument();
    expect(screen.getByText('На модерации')).toBeInTheDocument();
    expect(screen.getByText('Отклонён')).toBeInTheDocument();
  });

  it('selects restaurant on row click', async () => {
    const { setSelectedRestaurant } = setup();
    await userEvent.click(screen.getByText('Beta'));
    expect(setSelectedRestaurant).toHaveBeenCalledWith(restaurants[1]);
  });

  it('marks selected restaurant active', () => {
    setup({ selectedRestaurant: restaurants[0] as Restaurant });
    expect(screen.getByText('Alpha').closest('.restaurant-row')).toHaveClass('active');
  });

  it('toggles add form via add button', async () => {
    const { setShowAddRestaurant } = setup();
    await userEvent.click(screen.getByRole('button', { name: /Добавить/ }));
    expect(setShowAddRestaurant).toHaveBeenCalledWith(true);
  });

  it('disables add button when profile not approved', () => {
    setup({ vendorProfile: { approval_status: 'PENDING' } as unknown as VendorProfile });
    expect(screen.getByRole('button', { name: /Добавить/ })).toBeDisabled();
  });

  it('shows form with error and edits fields', async () => {
    const { setNewRestaurant, handleCreateRestaurant } = setup({
      showAddRestaurant: true,
      formError: 'Ошибка',
      newRestaurant: {
        name: 'X',
        address: 'Y',
        avg_prep_time_minutes: '5',
        max_active_orders: '9',
      } as unknown as NewRestaurantForm,
    });
    expect(screen.getByText('Новое заведение')).toBeInTheDocument();
    expect(screen.getByText('Ошибка')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Название'), 'Z');
    await userEvent.type(screen.getByPlaceholderText('Адрес'), 'Z');
    await userEvent.type(screen.getByPlaceholderText(/Среднее время/), '1');
    await userEvent.type(screen.getByPlaceholderText(/Мягкий лимит/), '1');
    expect(setNewRestaurant).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));
    expect(handleCreateRestaurant).toHaveBeenCalled();
  });

  it('disables create button when formLoading', () => {
    setup({ showAddRestaurant: true, formLoading: true });
    expect(screen.getByRole('button', { name: 'Создать' })).toBeDisabled();
  });

  it('shows skeletons while loading with no restaurants', () => {
    const { container } = render(
      <VendorRestaurantList
        restaurants={[]}
        loading
        selectedRestaurant={null}
        setSelectedRestaurant={vi.fn()}
        vendorProfile={null}
        showAddRestaurant={false}
        setShowAddRestaurant={vi.fn()}
        newRestaurant={emptyForm}
        setNewRestaurant={vi.fn()}
        formError=""
        formLoading={false}
        handleCreateRestaurant={vi.fn()}
      />,
    );
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('shows empty state when no restaurants and not loading', () => {
    setup({ restaurants: [] });
    expect(screen.getByText('Нет заведений')).toBeInTheDocument();
  });
});
