import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import type { PlatformStats } from '@shared/types/models';
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage';
vi.mock('../../services/adminService', () => ({
  adminService: {
    getPlatformStats: vi.fn(),
    getUsers: vi.fn(),
    getOrders: vi.fn(),
    getRestaurants: vi.fn(),
    getVendors: vi.fn(),
    getReviews: vi.fn(),
    getFinance: vi.fn(),
    getAdvancedAnalytics: vi.fn(),
    getAuditLogs: vi.fn(),
    exportData: vi.fn(),
    deactivateUser: vi.fn(),
    activateUser: vi.fn(),
    setUserPermissions: vi.fn(),
    deleteUser: vi.fn(),
    approveRestaurant: vi.fn(),
    rejectRestaurant: vi.fn(),
    deleteRestaurant: vi.fn(),
    approveVendor: vi.fn(),
    rejectVendor: vi.fn(),
    deleteVendor: vi.fn(),
    deleteReview: vi.fn(),
    getUserDetails: vi.fn(),
    getRestaurantDetails: vi.fn(),
    getVendorDetails: vi.fn(),
    batchActivateUsers: vi.fn(),
    batchDeactivateUsers: vi.fn(),
    batchDeleteReviews: vi.fn(),
    batchApproveVendors: vi.fn(),
    batchRejectVendors: vi.fn(),
    batchApproveRestaurants: vi.fn(),
    batchRejectRestaurants: vi.fn(),
  },
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel?: (s: unknown) => unknown) => {
    const state = { user: { id: 'admin-1', name: 'Admin', permissions: ['admin'] } };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('../../utils/download', () => ({ downloadBlob: vi.fn() }));

const { adminService } = await import('../../services/adminService');

const STATS = {
  total_users: 100,
  total_orders: 500,
  total_restaurants: 10,
  total_revenue: 99999,
  orders_today: 20,
  new_users_today: 5,
} as unknown as PlatformStats;

const render$ = () =>
  render(
    <BrowserRouter>
      <AdminDashboardPage />
    </BrowserRouter>
  );

const emptyList = { items: [], total: 0 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(adminService.getPlatformStats).mockResolvedValue(STATS);
  vi.mocked(adminService.getUsers).mockResolvedValue(emptyList);
  vi.mocked(adminService.getOrders).mockResolvedValue(emptyList);
  vi.mocked(adminService.getRestaurants).mockResolvedValue(emptyList);
  vi.mocked(adminService.getVendors).mockResolvedValue(emptyList);
  vi.mocked(adminService.getReviews).mockResolvedValue(emptyList);
  vi.mocked(adminService.getFinance).mockResolvedValue({} as unknown as Awaited<ReturnType<typeof adminService.getFinance>>);
  vi.mocked(adminService.getAdvancedAnalytics).mockResolvedValue({} as unknown as Awaited<ReturnType<typeof adminService.getAdvancedAnalytics>>);
  vi.mocked(adminService.getAuditLogs).mockResolvedValue(emptyList);
});

describe('AdminDashboardPage', () => {
  it('renders stats tab by default and loads stats', async () => {
    render$();
    expect(screen.getByText('Статистика')).toBeInTheDocument();
    await waitFor(() => {
      expect(adminService.getPlatformStats).toHaveBeenCalledTimes(1);
    });
  });

  it('renders all sidebar navigation tabs', () => {
    render$();
    const labels = ['Статистика', 'Пользователи', 'Заказы', 'Модерация', 'Рестораны', 'Вендоры', 'Отзывы', 'Аналитика'];
    labels.forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
  });

  it('switches to users tab on click', async () => {
    const user = userEvent.setup();
    render$();
    const usersBtn = screen.getAllByText('Пользователи')[0];
    if (!usersBtn) throw new Error('tab button not found');
    await user.click(usersBtn);
    await waitFor(() => {
      expect(adminService.getUsers).toHaveBeenCalled();
    });
  });

  it('switches to restaurants tab and loads data', async () => {
    const user = userEvent.setup();
    render$();
    const btn = screen.getAllByText('Рестораны')[0];
    if (!btn) throw new Error('tab button not found');
    await user.click(btn);
    await waitFor(() => {
      expect(adminService.getRestaurants).toHaveBeenCalled();
    });
  });

  it('switches to vendors tab and loads data', async () => {
    const user = userEvent.setup();
    render$();
    const btn = screen.getAllByText('Вендоры')[0];
    if (!btn) throw new Error('tab button not found');
    await user.click(btn);
    await waitFor(() => {
      expect(adminService.getVendors).toHaveBeenCalled();
    });
  });

  it('switches to reviews tab and loads data', async () => {
    const user = userEvent.setup();
    render$();
    const btn = screen.getAllByText('Отзывы')[0];
    if (!btn) throw new Error('tab button not found');
    await user.click(btn);
    await waitFor(() => {
      expect(adminService.getReviews).toHaveBeenCalled();
    });
  });

  it('switches to orders tab and loads data', async () => {
    const user = userEvent.setup();
    render$();
    const btn = screen.getAllByText('Заказы')[0];
    if (!btn) throw new Error('tab button not found');
    await user.click(btn);
    await waitFor(() => {
      expect(adminService.getOrders).toHaveBeenCalled();
    });
  });

  it('does not reload stats if already loaded', async () => {
    const user = userEvent.setup();
    render$();
    await waitFor(() => { expect(adminService.getPlatformStats).toHaveBeenCalledTimes(1); });
    const usersTab = screen.getAllByText('Пользователи')[0];
    const statsTab = screen.getAllByText('Статистика')[0];
    if (!usersTab || !statsTab) throw new Error('tab button not found');
    await user.click(usersTab);
    await user.click(statsTab);
    await waitFor(() => { expect(adminService.getPlatformStats).toHaveBeenCalledTimes(1); });
  });
});
