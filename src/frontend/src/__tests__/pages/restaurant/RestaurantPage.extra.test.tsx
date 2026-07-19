import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RestaurantPage } from '../../../pages/restaurant/RestaurantPage';
import { at } from '../../testUtils';

const controllerState = vi.hoisted((): { current: Record<string, unknown> } => ({ current: {} }));
const authState = vi.hoisted((): { current: { user: unknown } } => ({ current: { user: null } }));

vi.mock('@shared/hooks/useRestaurantPageController', () => ({
  useRestaurantPageController: () => controllerState.current,
}));
vi.mock('../../../store/useCartStore', () => ({
  useCartStore: (sel?: (s: { addToCart: () => void }) => unknown) => {
    const state = { addToCart: vi.fn() };
    return sel ? sel(state) : state;
  },
}));
vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: (sel?: (s: { user: unknown }) => unknown) => {
    const state = authState.current;
    return sel ? sel(state) : state;
  },
}));
vi.mock('@shared/store/useModalStore', () => ({
  useModalStore: (sel?: (s: { requestConfirm: () => void }) => unknown) => {
    const state = { requestConfirm: vi.fn() };
    return sel ? sel(state) : state;
  },
}));
vi.mock('@shared/store/useFavoriteStore', () => ({
  useFavoriteStore: (sel?: (s: { favoriteIds: string[]; toggle: () => void }) => unknown) => {
    const state = { favoriteIds: [], toggle: vi.fn() };
    return sel ? sel(state) : state;
  },
}));
vi.mock('@shared/services/staffService', () => ({
  staffService: { createRequest: vi.fn() },
}));
vi.mock('@shared/components/MenuItemCard/MenuItemCard', () => ({
  MenuItemCard: ({ item, onSelect }: { item: { id: string; name: string }; onSelect: (i: unknown) => void }) => (
    <button onClick={() => { onSelect(item); }}>ITEM_{item.name}</button>
  ),
}));
vi.mock('@shared/components/ProductSheet/ProductSheet', () => ({
  ProductSheet: ({ onClose }: { onClose: () => void }) => (
    <button onClick={onClose}>PRODUCT_SHEET_CLOSE</button>
  ),
}));
vi.mock('../../../components/ShareModal/ShareModal', () => ({
  ShareModal: ({ onClose }: { onClose: () => void }) => (
    <button onClick={onClose}>SHARE_CLOSE</button>
  ),
}));
vi.mock('@shared/components/ReviewsModal/ReviewsModal', () => ({
  ReviewsModal: ({ onClose }: { onClose: () => void }) => (
    <button onClick={onClose}>REVIEWS_CLOSE</button>
  ),
}));
vi.mock('@shared/components/InfoModal/InfoModal', () => ({
  InfoModal: ({ onClose }: { onClose: () => void }) => (
    <button onClick={onClose}>INFO_CLOSE</button>
  ),
}));

const { staffService } = await import('@shared/services/staffService');

const makeController = (over: Record<string, unknown> = {}) => ({
  restaurant: { id: 'u1', name: 'Test Resto' },
  restaurantView: { id: 'u1', name: 'Test Resto', address: 'Addr', is_open: true, is_hiring: false },
  restaurantUUID: 'u1',
  rating: { average_rating: 4.5 },
  workingHours: [],
  loading: false,
  isRestaurantOpen: true,
  categories: ['ALL', 'SHAURMA'],
  activeCategory: 'ALL',
  setActiveCategory: vi.fn(),
  filteredMenuItems: [{ id: 'm1', name: 'Shaurma' }],
  reviewsList: [],
  reviewsPage: 1,
  setReviewsPage: vi.fn(),
  reviewsTotal: 0,
  reviewForm: {},
  setReviewForm: vi.fn(),
  reviewsLoading: false,
  reviewError: '',
  reviewSuccess: '',
  selectedProduct: null,
  setSelectedProduct: vi.fn(),
  isFav: false,
  myReview: null,
  otherReviews: [],
  reviewsButtonLabel: '4.5 (3)',
  handleProductAdd: vi.fn(),
  handleToggleFavorite: vi.fn(),
  handleDeleteWithConfirm: vi.fn(),
  handleReviewSubmitForm: vi.fn(),
  ...over,
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/restaurants/u1']}>
      <Routes>
        <Route path="/restaurants/:id" element={<RestaurantPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('RestaurantPage extra branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controllerState.current = makeController();
    authState.current = { user: null };
  });

  it('renders hero, categories and menu item', () => {
    renderPage();
    expect(screen.getByText('Test Resto')).toBeInTheDocument();
    expect(screen.getByText('Все')).toBeInTheDocument();
    expect(screen.getByText('ITEM_Shaurma')).toBeInTheDocument();
  });

  it('switches category', async () => {
    renderPage();
    await userEvent.click(screen.getByText('Шаурма'));
    expect(controllerState.current['setActiveCategory'] as Mock).toHaveBeenCalledWith('SHAURMA');
  });

  it('shows closed banner when restaurant is closed', () => {
    controllerState.current = makeController({
      restaurantView: { id: 'u1', name: 'Test Resto', address: 'Addr', is_open: false },
    });
    renderPage();
    expect(screen.getByText(/временно закрыто/)).toBeInTheDocument();
  });

  it('shows skeletons while loading', () => {
    controllerState.current = makeController({ loading: true });
    const { container } = renderPage();
    expect(container.querySelectorAll('.menu-item-skeleton').length).toBeGreaterThan(0);
  });

  it('opens reviews, info and share modals and closes them', async () => {
    renderPage();
    await userEvent.click(screen.getByText('4.5 (3)'));
    await userEvent.click(screen.getByText('REVIEWS_CLOSE'));
    await userEvent.click(screen.getByText('Инфо'));
    await userEvent.click(screen.getByText('INFO_CLOSE'));
    await userEvent.click(screen.getByRole('button', { name: 'Поделиться рестораном' }));
    await userEvent.click(screen.getByText('SHARE_CLOSE'));
    expect(screen.queryByText('SHARE_CLOSE')).not.toBeInTheDocument();
  });

  it('opens product sheet on item select and closes it', async () => {
    renderPage();
    await userEvent.click(screen.getByText('ITEM_Shaurma'));
    expect(controllerState.current['setSelectedProduct'] as Mock).toHaveBeenCalledWith({ id: 'm1', name: 'Shaurma' });
    controllerState.current = makeController({ selectedProduct: { id: 'm1', name: 'Shaurma' } });
    renderPage();
    await userEvent.click(at(screen.getAllByText('PRODUCT_SHEET_CLOSE'), 0));
    expect(controllerState.current['setSelectedProduct'] as Mock).toHaveBeenCalledWith(null);
  });

  it('shows favorite button and toggles when logged in', async () => {
    authState.current = { user: { id: 'usr', permissions: ['reviews.create'] } };
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /избранное/ }));
    expect(controllerState.current['handleToggleFavorite'] as Mock).toHaveBeenCalled();
  });

  it('opens hiring modal and submits staff request successfully', async () => {
    vi.mocked(staffService.createRequest).mockResolvedValue({} as never);
    controllerState.current = makeController({
      restaurantView: { id: 'u1', name: 'Test Resto', address: 'Addr', is_open: true, is_hiring: true },
    });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /ищет сотрудников/ }));
    await userEvent.type(screen.getByPlaceholderText('Расскажите о себе...'), 'Резюме');
    await userEvent.click(screen.getByRole('button', { name: 'Отправить заявку' }));
    await waitFor(() => { expect(staffService.createRequest).toHaveBeenCalledWith('u1', { message: 'Резюме' }); });
  });

  it('shows error when staff request fails', async () => {
    vi.mocked(staffService.createRequest).mockRejectedValue(new Error('boom'));
    controllerState.current = makeController({
      restaurantView: { id: 'u1', name: 'Test Resto', address: 'Addr', is_open: true, is_hiring: true },
    });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /ищет сотрудников/ }));
    await userEvent.type(screen.getByPlaceholderText('Расскажите о себе...'), 'Резюме');
    await userEvent.click(screen.getByRole('button', { name: 'Отправить заявку' }));
    await waitFor(() =>
      { expect(screen.getByText('Ошибка при отправке заявки')).toBeInTheDocument(); },
    );
  });

  it('does nothing on staff submit when no restaurant uuid', async () => {
    controllerState.current = makeController({
      restaurantUUID: null,
      restaurantView: { id: 'u1', name: 'Test Resto', address: 'Addr', is_open: true, is_hiring: true },
    });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /ищет сотрудников/ }));
    await userEvent.type(screen.getByPlaceholderText('Расскажите о себе...'), 'Резюме');
    await userEvent.click(screen.getByRole('button', { name: 'Отправить заявку' }));
    expect(staffService.createRequest).not.toHaveBeenCalled();
  });
});
