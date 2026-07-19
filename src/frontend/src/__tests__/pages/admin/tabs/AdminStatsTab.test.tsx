import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AdminStatsTab } from '../../../../pages/admin/tabs/AdminStatsTab';
import type { PlatformStats } from '@shared/types/models';

vi.mock('../../../../components/dashboard/DashboardCharts', () => ({
  UsersByRoleChart: ({ data }: { data: Record<string, number> }) => (
    <div data-testid="users-by-role">{Object.keys(data).join(',')}</div>
  ),
  OrderStatusPieChart: ({ data }: { data?: Record<string, number> }) => (
    <div data-testid="order-status-pie">{data ? Object.keys(data).join(',') : 'no-data'}</div>
  ),
}));

const makeStats = (overrides: Partial<PlatformStats> = {}): PlatformStats =>
  ({
    total_users: 42,
    total_restaurants: 7,
    total_vendors: 3,
    users_by_role: { CUSTOMER: 40, VENDOR: 2 },
    orders_by_status: { PENDING: 5, COMPLETED: 10 },
    growth: {
      users: [
        { count: 1 },
        { count: 3 },
        { count: 2 },
      ],
      restaurants: [{ count: 1 }],
      orders: [],
    },
    ...overrides,
  }) as unknown as PlatformStats;

describe('AdminStatsTab', () => {
  it('returns null when stats is null', () => {
    const { container } = render(
      <AdminStatsTab stats={null} ordersByStatusChartData={null} setActiveTab={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders stat cards with values', () => {
    render(
      <AdminStatsTab
        stats={makeStats()}
        ordersByStatusChartData={{ PENDING: 5 }}
        setActiveTab={vi.fn()}
      />
    );
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('navigates via each stat card click', async () => {
    const user = userEvent.setup();
    const setActiveTab = vi.fn();
    render(
      <AdminStatsTab
        stats={makeStats()}
        ordersByStatusChartData={{ PENDING: 5 }}
        setActiveTab={setActiveTab}
      />
    );
    await user.click(screen.getByRole('button', { name: /Пользователи/ }));
    await user.click(screen.getByRole('button', { name: /Рестораны/ }));
    await user.click(screen.getByRole('button', { name: /Заказы/ }));
    await user.click(screen.getByRole('button', { name: /Вендоры/ }));
    expect(setActiveTab).toHaveBeenCalledWith('users');
    expect(setActiveTab).toHaveBeenCalledWith('restaurants');
    expect(setActiveTab).toHaveBeenCalledWith('orders');
    expect(setActiveTab).toHaveBeenCalledWith('vendors');
  });

  it('falls back to zero counts and empty growth when fields missing', () => {
    render(
      <AdminStatsTab
        stats={makeStats({
          total_restaurants: undefined,
          total_vendors: undefined,
          orders_by_status: undefined,
          growth: undefined,
          users_by_role: undefined,
        } as unknown as Partial<PlatformStats>)}
        ordersByStatusChartData={null}
        setActiveTab={vi.fn()}
      />
    );
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getByTestId('order-status-pie')).toHaveTextContent('no-data');
    expect(screen.getByTestId('users-by-role')).toBeInTheDocument();
  });

  it('renders order status pie with data when provided', () => {
    render(
      <AdminStatsTab
        stats={makeStats()}
        ordersByStatusChartData={{ PENDING: 5, COMPLETED: 10 }}
        setActiveTab={vi.fn()}
      />
    );
    expect(screen.getByTestId('order-status-pie')).toHaveTextContent('PENDING,COMPLETED');
  });

  it('renders sparkline totals for the users card', () => {
    render(
      <AdminStatsTab
        stats={makeStats()}
        ordersByStatusChartData={null}
        setActiveTab={vi.fn()}
      />
    );
    expect(screen.getByText('+6 за последние 14 дней')).toBeInTheDocument();
  });
});
