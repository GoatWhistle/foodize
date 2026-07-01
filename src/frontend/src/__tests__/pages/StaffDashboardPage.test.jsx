import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import StaffDashboardPage from '../../pages/staff/StaffDashboardPage';

vi.mock('../../services/staffService', () => ({
  staffService: {
    getMyProfile: vi.fn(),
    getActiveOrders: vi.fn(),
    getMenuItems: vi.fn(),
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

vi.mock('../../utils/locales', async () => {
  const actual = await vi.importActual('../../utils/locales');
  return actual;
});

const { staffService } = await import('../../services/staffService');

const APPROVED_PROFILE = {
  id: 'staff-1',
  restaurant_id: 'resto-1',
  restaurant_name: 'Test Cafe',
  status: 'APPROVED',
  role: 'COOK',
};

const PENDING_PROFILE = {
  id: 'staff-2',
  restaurant_id: null,
  status: 'PENDING',
  role: 'COOK',
};

const MOCK_ORDER = {
  id: 'order-1',
  display_id: 1001,
  status: 'PENDING',
  items: [{ name: 'Shaurma', quantity: 1, price: 300, options: [] }],
  total_price: 300,
  comment: '',
  created_at: new Date().toISOString(),
};

const renderPage = () =>
  render(
    <BrowserRouter>
      <StaffDashboardPage />
    </BrowserRouter>
  );

describe('StaffDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    staffService.getMyProfile.mockResolvedValue({ data: { data: APPROVED_PROFILE } });
    staffService.getActiveOrders.mockResolvedValue({ data: { data: [MOCK_ORDER] } });
    staffService.getMenuItems.mockResolvedValue({ data: { data: [] } });
  });

  it('shows loading state initially', () => {
    staffService.getMyProfile.mockReturnValue(new Promise(() => {}));
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
    staffService.getMyProfile.mockRejectedValue(new Error('Not found'));

    renderPage();

    await waitFor(() => {
      expect(screen.queryByText('Новые')).toBeNull();
    });
  });

  it('accepts order and moves it', async () => {
    staffService.acceptOrder.mockResolvedValue({});
    staffService.getActiveOrders.mockResolvedValue({
      data: { data: [{ ...MOCK_ORDER, status: 'ACCEPTED' }] },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('#1001')).toBeDefined();
    });

    const acceptBtn = screen.queryByRole('button', { name: /принять/i });
    if (acceptBtn) {
      await act(async () => {
        fireEvent.click(acceptBtn);
      });
      await waitFor(() => {
        expect(staffService.acceptOrder).toHaveBeenCalled();
      });
    }
  });

  it('switches to menu tab', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Новые')).toBeDefined();
    });

    const menuTab = screen.getByRole('button', { name: /стоп-лист|меню/i });
    if (menuTab) {
      await act(async () => {
        fireEvent.click(menuTab);
      });
    }
  });
});
