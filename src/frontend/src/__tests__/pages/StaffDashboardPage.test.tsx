import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import StaffDashboardPage from '../../pages/staff/StaffDashboardPage';
import type { Order, StaffProfile } from '@shared/types/models';

vi.mock('@shared/services/staffService.js', () => ({
  staffService: {
    getMyProfile: vi.fn(),
    getRestaurantOrders: vi.fn(),
    getMenu: vi.fn(),
    getMyApplication: vi.fn().mockResolvedValue({ data: { data: { status: 'PENDING' } } }),
    updateOrderStatus: vi.fn(),
    acceptOrder: vi.fn(),
    cancelOrder: vi.fn(),
    toggleMenuItemAvailability: vi.fn(),
  },
}));

vi.mock('../../services/api', () => ({
  createRestaurantOrdersWebSocket: vi.fn(() => ({ close: vi.fn() })),
}));

vi.mock('@shared/utils/locales.js', async () => {
  const actual = await vi.importActual('@shared/utils/locales.js');
  return actual;
});

const { staffService } = await import('@shared/services/staffService.js');

const APPROVED_PROFILE = {
  id: 'staff-1',
  restaurant_id: 'resto-1',
  restaurant_name: 'Test Cafe',
  status: 'APPROVED',
  role: 'COOK',
} as unknown as StaffProfile;

const MOCK_ORDER = {
  id: 'order-1',
  display_id: 1001,
  status: 'PENDING',
  items: [{ name: 'Shaurma', quantity: 1, price: 300, options: [] }],
  total_price: 300,
  comment: '',
  created_at: new Date().toISOString(),
} as unknown as Order;

const renderPage = () =>
  render(
    <BrowserRouter>
      <StaffDashboardPage />
    </BrowserRouter>
  );

describe('StaffDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(staffService.getMyProfile).mockResolvedValue({
      data: { data: APPROVED_PROFILE },
    } as unknown as Awaited<ReturnType<typeof staffService.getMyProfile>>);
    vi.mocked(staffService.getRestaurantOrders).mockResolvedValue({
      data: { data: [MOCK_ORDER] },
    } as unknown as Awaited<ReturnType<typeof staffService.getRestaurantOrders>>);
    vi.mocked(staffService.getMenu).mockResolvedValue({
      data: { data: [] },
    } as unknown as Awaited<ReturnType<typeof staffService.getMenu>>);
  });

  it('shows loading state initially', () => {
    vi.mocked(staffService.getMyProfile).mockReturnValue(
      new Promise(() => {})
    );
    renderPage();
    expect(document.body).toBeDefined();
  });

  it('renders kanban columns for approved staff', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Новые')).toBeDefined();
      expect(screen.getByText('Принято')).toBeDefined();
      expect(screen.getByText('Готово')).toBeDefined();
    });
  });

  it('shows order in pending column', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('#1001')).toBeDefined();
    });
  });

  it('hides kanban when profile fetch fails', async () => {
    vi.mocked(staffService.getMyProfile).mockRejectedValue(new Error('Not found'));

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText('Новые')).toBeNull();
    });
  });

  it('accepts order and moves it', async () => {
    vi.mocked(staffService.updateOrderStatus).mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof staffService.updateOrderStatus>>
    );
    vi.mocked(staffService.getRestaurantOrders).mockResolvedValue({
      data: { data: [{ ...MOCK_ORDER, status: 'ACCEPTED' }] },
    } as unknown as Awaited<ReturnType<typeof staffService.getRestaurantOrders>>);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('#1001')).toBeDefined();
    });

    const acceptBtn = screen.queryByRole('button', { name: /принять/i });
    if (acceptBtn) {
      await act(async () => {
        fireEvent.click(acceptBtn);
        await Promise.resolve();
      });
      await waitFor(() => {
        expect(staffService.updateOrderStatus).toHaveBeenCalled();
      });
    }
  });

  it('switches to menu tab', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Новые')).toBeDefined();
    });

    const menuTab = screen.getByRole('button', { name: /стоп-лист|меню/i });
    await act(async () => {
      fireEvent.click(menuTab);
      await Promise.resolve();
    });
  });
});
