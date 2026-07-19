import {
  render,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { VendorDashboardPage } from '../../pages/vendor/VendorDashboardPage';
import { useAuthStore } from '../../store/useAuthStore';
import { useRestaurantStore } from '@shared/store/useRestaurantStore.js';
import { vendorService } from '@shared/services/vendorService.js';
import type { Restaurant } from '@shared/types/models';

type AuthState = {
  user: { name: string; phone_number: string };
  logout?: () => void;
};

type RestaurantState = {
  restaurants: Restaurant[];
  fetchMyRestaurants: () => void;
  fetchMenu: () => void;
  createRestaurant: (...args: unknown[]) => void;
  addMenuItem: (...args: unknown[]) => void;
  publicLoading: boolean;
  myLoading: boolean;
  menuLoading: boolean;
  menus: Record<string, unknown[]>;
};

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel?: (s: AuthState) => unknown) => {
    const state: AuthState = {
      user: { name: 'Ivan Ivanov', phone_number: '+7999' },
    };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('@shared/store/useRestaurantStore.js', () => ({
  useRestaurantStore: vi.fn((sel?: (s: RestaurantState) => unknown) => {
    const state: RestaurantState = {
      restaurants: [{ id: 'r1', name: 'My Resto', address: 'Addr 1' }] as unknown as Restaurant[],
      fetchMyRestaurants: vi.fn(),
      fetchMenu: vi.fn(),
      createRestaurant: vi.fn(),
      addMenuItem: vi.fn(),
      publicLoading: false,
      myLoading: false,
      menuLoading: false,
      menus: { r1: [] },
    };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('@shared/services/vendorService.js', () => ({
  vendorService: {
    getStaffRequests: vi.fn().mockResolvedValue({ data: [] }),
    updateStaffStatus: vi.fn(),
    getStaffMembers: vi.fn().mockResolvedValue({ data: { data: [] } }),
    removeStaffMember: vi.fn().mockResolvedValue({}),
    getMyProfile: vi
      .fn()
      .mockResolvedValue({ data: { data: { approval_status: 'APPROVED' } } }),
  },
}));

describe('VendorDashboardPage', () => {
  const createRestaurantMock = vi.fn();
  const fetchMyRestaurantsMock = vi.fn();
  const fetchMenuMock = vi.fn();
  const addMenuItemMock = vi.fn();
  const logoutMock = vi.fn();

  const waitForVendorEffects = async () => {
    await waitFor(() => {
      expect(vendorService.getMyProfile).toHaveBeenCalled();
      expect(vendorService.getStaffRequests).toHaveBeenCalled();
      expect(vendorService.getStaffMembers).toHaveBeenCalled();
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockImplementation(((sel?: (s: AuthState) => unknown) => {
      const state: AuthState = {
        user: { name: 'Ivan Ivanov', phone_number: '+7999' },
        logout: logoutMock,
      };
      return sel ? sel(state) : state;
    }) as typeof useAuthStore);
    vi.mocked(useRestaurantStore).mockImplementation(((sel?: (s: RestaurantState) => unknown) => {
      const state: RestaurantState = {
        restaurants: [{ id: 'r1', name: 'My Resto', address: 'Addr 1' }] as unknown as Restaurant[],
        fetchMyRestaurants: fetchMyRestaurantsMock,
        fetchMenu: fetchMenuMock,
        createRestaurant: createRestaurantMock,
        addMenuItem: addMenuItemMock,
        publicLoading: false,
        myLoading: false,
        menuLoading: false,
        menus: { r1: [] },
      };
      return sel ? sel(state) : state;
    }) as typeof useRestaurantStore);
  });

  it('renders vendor dashboard with restaurants', async () => {
    render(
      <BrowserRouter>
        <VendorDashboardPage />
      </BrowserRouter>
    );

    await waitForVendorEffects();

    expect(screen.getByText('Дашборд вендора')).toBeInTheDocument();
    expect(screen.getByText('My Resto')).toBeInTheDocument();
  });

  it('opens add restaurant form and submits', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <VendorDashboardPage />
      </BrowserRouter>
    );

    const addButton = await screen.findByRole('button', { name: /Добавить/ });
    await waitFor(() => { expect(addButton).not.toBeDisabled(); });
    await user.click(addButton);

    expect(screen.getByText('Новое заведение')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Название'), 'New Place');
    await user.type(screen.getByPlaceholderText('Адрес'), 'New Addr');

    await user.click(screen.getByText('Создать'));

    await waitFor(() => {
      expect(createRestaurantMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Place',
          address: 'New Addr',
          avg_prep_time_minutes: 15,
          max_active_orders: null,
        })
      );
    });
  });

  it('selects a restaurant and shows its menu section', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <VendorDashboardPage />
      </BrowserRouter>
    );

    await user.click(screen.getByText('My Resto'));

    expect(screen.getByText(/Позиции меню/)).toBeInTheDocument();
  });

  it('shows pending moderation banner when approval_status is PENDING', async () => {
    vi.mocked(vendorService.getMyProfile).mockResolvedValueOnce({
      data: { data: { approval_status: 'PENDING' } },
    } as unknown as Awaited<ReturnType<typeof vendorService.getMyProfile>>);

    render(
      <BrowserRouter>
        <VendorDashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Профиль на модерации')).toBeInTheDocument();
    });
  });

  it('shows rejected banner with reason when approval_status is REJECTED', async () => {
    vi.mocked(vendorService.getMyProfile).mockResolvedValueOnce({
      data: { data: { approval_status: 'REJECTED', rejection_reason: 'Неверные документы' } },
    } as unknown as Awaited<ReturnType<typeof vendorService.getMyProfile>>);

    render(
      <BrowserRouter>
        <VendorDashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Профиль отклонён')).toBeInTheDocument();
      expect(screen.getByText(/Неверные документы/)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching', async () => {
    let resolveProfile: (v?: unknown) => void = () => undefined;
    vi.mocked(vendorService.getMyProfile).mockReturnValueOnce(
      new Promise((res) => {
        resolveProfile = res as (v?: unknown) => void;
      })
    );
    vi.mocked(useRestaurantStore).mockImplementation(((sel?: (s: RestaurantState) => unknown) => {
      const state: RestaurantState = {
        restaurants: [],
        fetchMyRestaurants: fetchMyRestaurantsMock,
        fetchMenu: fetchMenuMock,
        createRestaurant: createRestaurantMock,
        addMenuItem: addMenuItemMock,
        publicLoading: false,
        myLoading: true,
        menuLoading: false,
        menus: {},
      };
      return sel ? sel(state) : state;
    }) as typeof useRestaurantStore);

    render(
      <BrowserRouter>
        <VendorDashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Дашборд вендора')).toBeInTheDocument();

    await act(async () => {
      resolveProfile({ data: { data: { approval_status: 'APPROVED' } } });
      await Promise.resolve();
    });
  });
});
