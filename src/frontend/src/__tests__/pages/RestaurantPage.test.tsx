import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RestaurantPage from '../../pages/restaurant/RestaurantPage';
import { useOrderStore } from '../../store/useOrderStore';
import type { MenuItem } from '@shared/types/models';

type RestaurantState = {
  fetchMenu: () => void;
  menus: Record<string, MenuItem[]>;
  loading: boolean;
};

type OrderState = {
  cart: unknown[];
  addToCart: (...args: unknown[]) => void;
  cartTotal: () => number;
  cartCount: () => number;
};

type AuthState = { user: unknown; isAuthenticated: boolean };
type ModalState = { requestConfirm: () => void };
type FavoriteState = { favoriteIds: string[]; toggle: () => void };

const menuItems = [
  {
    id: 'm1',
    name: 'Classic Shaurma',
    price: 300,
    category: 'SHAURMA',
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
  { id: 'm2', name: 'Veggie Burger', price: 400, category: 'BURGER' },
] as unknown as MenuItem[];

vi.mock('@shared/store/useRestaurantStore.js', () => ({
  useRestaurantStore: (sel?: (s: RestaurantState) => unknown) => {
    const state: RestaurantState = {
      fetchMenu: vi.fn(),
      menus: { 'mock-1': menuItems },
      loading: false,
    };
    return sel ? sel(state) : state;
  },
}));

vi.mock('@shared/store/useRestaurantStore.js', () => ({
  useRestaurantStore: (sel?: (s: RestaurantState) => unknown) => {
    const state: RestaurantState = {
      fetchMenu: vi.fn(),
      menus: { 'mock-1': menuItems },
      loading: false,
    };
    return sel ? sel(state) : state;
  },
}));

vi.mock('../../store/useOrderStore', () => ({
  useOrderStore: vi.fn((sel?: (s: OrderState) => unknown) => {
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
    const state: AuthState = { user: null, isAuthenticated: false };
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
    vi.mocked(useOrderStore).mockImplementation(((sel?: (s: OrderState) => unknown) => {
      const state: OrderState = {
        cart: [],
        addToCart: addToCartMock,
        cartTotal: () => 0,
        cartCount: () => 0,
      };
      return sel ? sel(state) : state;
    }) as typeof useOrderStore);
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

    expect(await screen.findByText('Test Restaurant')).toBeDefined();
    expect(await screen.findByText('Classic Shaurma')).toBeDefined();
    expect(screen.getByText('300 ₽')).toBeDefined();
  });

  it('opens product sheet and adds configured item to cart', async () => {
    renderWithRouter();

    expect(await screen.findByText('Classic Shaurma')).toBeDefined();
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /Открыть Classic Shaurma/ })
      );
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Добавить мясо'));
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.click(screen.getByText(/Добавить · 380 ₽/));
      await Promise.resolve();
    });

    expect(addToCartMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'm1' }),
      'mock-1',
      [expect.objectContaining({ id: 'o1' })],
      1
    );
  });

  it('filters menu items by category', async () => {
    renderWithRouter();

    expect(await screen.findByText('Classic Shaurma')).toBeDefined();
    expect(screen.getByText('Veggie Burger')).toBeDefined();

    await act(async () => {
      fireEvent.click(screen.getAllByText('Бургеры')[0]);
      await Promise.resolve();
    });

    expect(screen.queryByText('Classic Shaurma')).toBeNull();
    expect(screen.getByText('Veggie Burger')).toBeDefined();
  });
});
