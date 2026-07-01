import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../../pages/home/HomePage';

const defaultLogicState = {
  search: '',
  setSearch: vi.fn(),
  onlyOpen: false,
  setOnlyOpen: vi.fn(),
  sort: 'default',
  setSort: vi.fn(),
  direction: 'desc',
  setDirection: vi.fn(),
  page: 1,
  setPage: vi.fn(),
  allRestaurants: [
    { id: 'mock-1', name: 'Шаурма Хаус', display_id: 'shaurma' },
    { id: 'mock-2', name: 'Burger Point', display_id: 'burger' },
    { id: 'mock-3', name: 'Pizza Nova', display_id: 'pizza' },
    { id: 'mock-4', name: 'Sushi House', display_id: 'sushi' },
  ],
  publicRestaurantsTotal: 4,
  loading: false,
  resetFilters: vi.fn(),
  sentinelRef: { current: null },
  hasMore: false,
};

let mockLogicState = { ...defaultLogicState };

vi.mock('@shared/hooks/useHomePageLogic.js', () => ({
  useHomePageLogic: () => mockLogicState,
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: (sel) => {
    const state = { isAuthenticated: true };
    return sel ? sel(state) : state;
  },
}));

vi.mock('../../store/useFavoriteStore', () => ({
  useFavoriteStore: (sel) => {
    const state = { favoriteIds: [], toggle: vi.fn() };
    return sel ? sel(state) : state;
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

window.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogicState = { ...defaultLogicState };
  });

  it('renders search bar and open filter inside filter menu', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(
      screen.getByPlaceholderText('Поиск ресторана или адреса...')
    ).toBeDefined();

    fireEvent.click(screen.getByLabelText('Открыть фильтры'));
    expect(screen.getByText('Открыто')).toBeDefined();
  });

  it('renders all restaurant cards', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText('Шаурма Хаус')).toBeDefined();
    expect(screen.getByText('Burger Point')).toBeDefined();
    expect(screen.getByText('Pizza Nova')).toBeDefined();
    expect(screen.getByText('Sushi House')).toBeDefined();
  });

  it('navigates to restaurant page on card click', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Шаурма Хаус'));
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/restaurants/shaurma'),
      expect.anything()
    );
  });

  it('shows loading skeletons when loading is true', () => {
    mockLogicState = { ...defaultLogicState, loading: true, allRestaurants: [] };

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const skeletons = document.querySelectorAll('.restaurant-card-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no restaurants', () => {
    mockLogicState = {
      ...defaultLogicState,
      loading: false,
      allRestaurants: [],
      publicRestaurantsTotal: 0,
    };

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText('Ничего не найдено')).toBeDefined();
    expect(screen.queryByRole('article')).toBeNull();
  });
});
