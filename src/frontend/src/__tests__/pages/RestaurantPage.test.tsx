import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RestaurantPage } from '../../pages/restaurant/RestaurantPage';
import { useCartStore } from '../../store/useCartStore';
import type { MenuItem } from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';
import { categoryLabel } from '@shared/utils/locales';
import { formatPrice } from '@shared/utils/price';

type RestaurantState = {
  fetchMenu: () => void;
  menus: Record<string, MenuItem[]>;
  menuLoading: boolean;
};

type OrderState = {
  cart: unknown[];
  addToCart: (...args: unknown[]) => void;
  cartTotal: () => number;
  cartCount: () => number;
};

type AuthState = { user: unknown };
type ModalState = { requestConfirm: () => void };
type FavoriteState = { favoriteIds: string[]; toggle: () => void };

const menuItems = [
  {
    id: 'm1',
    name: 'Classic Shaurma',
    price: 300,
    category: 'SHAURMA',
    is_available: true,
    option_groups: [
      {
        id: 'g1',
        name: 'Добавки',
        selection_type: 'multiple',
        is_required: false,
        min_selected: 0,
        max_selected: 2,
        is_active: true,
        options: [
          { id: 'o1', name: 'Добавить мясо', price_delta: 80, is_available: true },
        ],
      },
    ],
  },
  { id: 'm2', name: 'Veggie Burger', price: 400, category: 'BURGER', is_available: true },
] as unknown as MenuItem[];

vi.mock('@shared/store/useRestaurantStore.js', () => ({
  useRestaurantStore: (sel?: (s: RestaurantState) => unknown) => {
    const state: RestaurantState = {
      fetchMenu: vi.fn(),
      menus: { 'mock-1': menuItems },
      menuLoading: false,
    };
    return sel ? sel(state) : state;
  },
}));

vi.mock('../../store/useCartStore', () => ({
  useCartStore: vi.fn((sel?: (s: OrderState) => unknown) => {
    const state: OrderState = {
      cart: [],
      addToCart: vi.fn(),
      cartTotal: () => 0,
      cartCount: () => 0,
    };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: (sel?: (s: AuthState) => unknown) => {
    const state: AuthState = { user: null };
    return sel ? sel(state) : state;
  },
}));

vi.mock('@shared/store/useModalStore.js', () => ({
  useModalStore: (sel?: (s: ModalState) => unknown) => {
    const state: ModalState = { requestConfirm: vi.fn() };
    return sel ? sel(state) : state;
  },
}));

vi.mock('@shared/store/useFavoriteStore.js', () => ({
  useFavoriteStore: (sel?: (s: FavoriteState) => unknown) => {
    const state: FavoriteState = { favoriteIds: [], toggle: vi.fn() };
    return sel ? sel(state) : state;
  },
}));

vi.mock('@shared/services/restaurantService.js', () => ({
  restaurantService: {
    getById: vi.fn().mockResolvedValue({
      data: { data: { id: 'mock-1', name: 'Test Restaurant' } },
    }),
    getWorkingHours: vi.fn().mockResolvedValue({ data: { data: [] } }),
  },
}));

vi.mock('@shared/services/reviewService.js', () => ({
  reviewService: {
    getRating: vi.fn().mockResolvedValue({ data: { data: { average_rating: 4.5 } } }),
    getReviews: vi.fn().mockResolvedValue({ data: { data: [], pagination: { total: 0 } } }),
    createReview: vi.fn().mockResolvedValue({}),
    updateMyReview: vi.fn().mockResolvedValue({}),
    deleteReview: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@shared/services/staffService.js', () => ({
  staffService: {
    createRequest: vi.fn().mockResolvedValue({}),
  },
}));

describe('RestaurantPage', () => {
  const addToCartMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCartStore).mockImplementation(((sel?: (s: OrderState) => unknown) => {
      const state: OrderState = {
        cart: [],
        addToCart: addToCartMock,
        cartTotal: () => 0,
        cartCount: () => 0,
      };
      return sel ? sel(state) : state;
    }) as typeof useCartStore);
  });

  const renderWithRouter = () =>
    render(
      <MemoryRouter initialEntries={['/restaurants/mock-1']}>
        <Routes>
          <Route path="/restaurants/:id" element={<RestaurantPage />} />
        </Routes>
      </MemoryRouter>
    );

  it('renders restaurant info and menu items', async () => {
    renderWithRouter();

    expect(await screen.findByText('Test Restaurant')).toBeInTheDocument();
    expect(await screen.findByText('Classic Shaurma')).toBeInTheDocument();
    expect(screen.getByText('300 ₽')).toBeInTheDocument();
  });

  it('opens product sheet and adds configured item to cart', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    expect(await screen.findByText('Classic Shaurma')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: t('catalog.menuItem.openAria', { name: 'Classic Shaurma' }) })
    );
    await user.click(screen.getByText('Добавить мясо'));
    await user.click(screen.getByText(t('catalog.product.add', { total: formatPrice(380) })));

    expect(addToCartMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'm1' }),
      'mock-1',
      [expect.objectContaining({ id: 'o1' })],
      1
    );
  });

  it('filters menu items by category', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    expect(await screen.findByText('Classic Shaurma')).toBeInTheDocument();
    expect(screen.getByText('Veggie Burger')).toBeInTheDocument();

    const burgersTab = screen.getAllByText(categoryLabel('BURGER'))[0];
    if (!burgersTab) throw new Error('category tab not found');
    await user.click(burgersTab);

    expect(screen.queryByText('Classic Shaurma')).toBeNull();
    expect(screen.getByText('Veggie Burger')).toBeInTheDocument();
  });
});
