import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import type { Restaurant } from '@shared/types/models';
import { HomePage } from '../../pages/home/HomePage';
type LogicState = {
  search: string;
  setSearch: ReturnType<typeof vi.fn>;
  onlyOpen: boolean;
  setOnlyOpen: ReturnType<typeof vi.fn>;
  sort: string;
  setSort: ReturnType<typeof vi.fn>;
  direction: string;
  setDirection: ReturnType<typeof vi.fn>;
  page: number;
  setPage: ReturnType<typeof vi.fn>;
  allRestaurants: Restaurant[];
  publicRestaurantsTotal: number;
  loading: boolean;
  resetFilters: ReturnType<typeof vi.fn>;
  sentinelRef: { current: HTMLElement | null };
  hasMore: boolean;
};

const defaultLogicState: LogicState = {
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
  ] as unknown as Restaurant[],
  publicRestaurantsTotal: 4,
  loading: false,
  resetFilters: vi.fn(),
  sentinelRef: { current: null },
  hasMore: false,
};

let mockLogicState: LogicState = { ...defaultLogicState };

vi.mock('@shared/hooks/useHomePageLogic.js', () => ({
  useHomePageLogic: () => mockLogicState,
}));

let mockAuthUser: { id: string } | null = { id: 'u1' };
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: (sel?: (s: { user: { id: string } | null }) => unknown) => {
    const state = { user: mockAuthUser };
    return sel ? sel(state) : state;
  },
}));

vi.mock('@shared/store/useFavoriteStore.js', () => ({
  useFavoriteStore: (sel?: (s: { favoriteIds: string[]; toggle: ReturnType<typeof vi.fn> }) => unknown) => {
    const state = { favoriteIds: [], toggle: vi.fn() };
    return sel ? sel(state) : state;
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
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
    mockAuthUser = { id: 'u1' };
  });

  it('renders search bar and open filter inside filter menu', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(
      screen.getByPlaceholderText('Поиск ресторана или адреса...')
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText('Открыть фильтры'));
    expect(screen.getByText('Открыто')).toBeInTheDocument();
  });

  it('renders all restaurant cards', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText('Шаурма Хаус')).toBeInTheDocument();
    expect(screen.getByText('Burger Point')).toBeInTheDocument();
    expect(screen.getByText('Pizza Nova')).toBeInTheDocument();
    expect(screen.getByText('Sushi House')).toBeInTheDocument();
  });

  it('navigates to restaurant page on card click', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    await user.click(screen.getByText('Шаурма Хаус'));
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

    expect(screen.getByRole('status', { name: 'Загрузка ресторанов' })).toBeInTheDocument();
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

    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    expect(screen.queryByRole('article')).toBeNull();
  });

  it('redirects to login on card click when not authenticated', async () => {
    mockAuthUser = null;
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    await user.click(screen.getByText('Шаурма Хаус'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('falls back to restaurant id when display_id is missing', async () => {
    mockLogicState = {
      ...defaultLogicState,
      allRestaurants: [
        { id: 'no-display', name: 'No Display', display_id: null },
      ] as unknown as Restaurant[],
      publicRestaurantsTotal: 1,
    };
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    await user.click(screen.getByText('No Display'));
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/restaurants/no-display'),
      expect.anything()
    );
  });

  it('keeps the grid mounted while a background refresh is loading', () => {
    mockLogicState = { ...defaultLogicState, loading: true };
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(container.querySelector('.restaurants-grid--loading')).not.toBeNull();
    expect(screen.getByText('Шаурма Хаус')).toBeInTheDocument();
  });

  it('resets filters from the empty state action', async () => {
    const resetFilters = vi.fn();
    mockLogicState = {
      ...defaultLogicState,
      loading: false,
      allRestaurants: [],
      publicRestaurantsTotal: 0,
      resetFilters,
    };
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Сбросить' }));
    expect(resetFilters).toHaveBeenCalled();
  });
});
