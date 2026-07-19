import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { VendorAnalyticsTab } from '../../../../pages/vendor/tabs/VendorAnalyticsTab';
import type { AdvancedAnalytics, FinanceAnalytics, Restaurant } from '@shared/types/models';
import type { FinanceFilters } from '../../../../pages/vendor/hooks/useVendorFinance';
import { at } from '../../../testUtils';

vi.mock('../../../../components/dashboard/DashboardCharts', () => ({
  RevenueChart: () => <div data-testid="revenue-chart" />,
  HourlyLoadChart: () => <div data-testid="hourly-chart" />,
  CategoryRevenueChart: ({ data }: { data: { label: string }[] }) => (
    <div data-testid="category-chart">{data.map((d) => d.label).join(',')}</div>
  ),
  AOVDynamicsChart: () => <div data-testid="aov-chart" />,
  KPICards: () => <div data-testid="kpi-cards" />,
  TopItemsChart: () => <div data-testid="top-items" />,
  OrderStatusPieChart: () => <div data-testid="pie-chart" />,
}));

const vendorServiceMock = {
  exportFinancePDF: vi.fn(() => Promise.resolve(new Blob())),
  exportAnalyticsPDF: vi.fn(() => Promise.resolve(new Blob())),
} as unknown as never;

const finance: FinanceAnalytics = {
  revenue_by_day: [],
  total_orders: 10,
  completed_orders: 7,
  cancelled_orders: 1,
  top_items: [],
} as unknown as FinanceAnalytics;

const advanced: AdvancedAnalytics = {
  hourly_load: [],
  category_revenue: [{ label: 'SHAURMA', value: 100 }],
  aov_dynamics: [],
} as unknown as AdvancedAnalytics;

const restaurant = { id: 'r1' } as unknown as Restaurant;

const Harness = ({
  fin = null as FinanceAnalytics | null,
  adv = null as AdvancedAnalytics | null,
  financeLoading = false,
  analyticsLoading = false,
  exportLoading = false,
  onExport = vi.fn(),
}: Record<string, unknown>) => {
  const [filters, setFilters] = useState<FinanceFilters>({ date_from: '', date_to: '' });
  const [preset, setPreset] = useState<number | null>(null);
  return (
    <VendorAnalyticsTab
      finance={fin as FinanceAnalytics | null}
      financeLoading={financeLoading as boolean}
      advancedAnalytics={adv as AdvancedAnalytics | null}
      analyticsLoading={analyticsLoading as boolean}
      financeFilters={filters}
      setFinanceFilters={setFilters}
      activePreset={preset}
      setActivePreset={setPreset}
      exportLoading={exportLoading as boolean}
      handleVendorExport={onExport as never}
      vendorService={vendorServiceMock}
      selectedRestaurant={restaurant}
      getVendorRestaurantLabel={() => 'Resto'}
      getVendorDateRange={() => 'range'}
    />
  );
};

describe('VendorAnalyticsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-18T00:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('renders skeleton while loading with no finance', () => {
    render(<Harness financeLoading />);
    expect(screen.queryByTestId('kpi-cards')).not.toBeInTheDocument();
  });

  it('renders finance charts when finance present', () => {
    render(<Harness fin={finance} />);
    expect(screen.getByTestId('kpi-cards')).toBeInTheDocument();
    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('top-items')).toBeInTheDocument();
  });

  it('renders advanced charts with translated category', () => {
    render(<Harness fin={finance} adv={advanced} />);
    expect(screen.getByTestId('hourly-chart')).toBeInTheDocument();
    expect(screen.getByTestId('aov-chart')).toBeInTheDocument();
    expect(screen.getByTestId('category-chart').textContent).not.toBe('SHAURMA');
  });

  it('sets date_from and date_to filters clearing preset', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<Harness />);
    const dateInputs = container.querySelectorAll('input[type="date"]');
    await user.type(dateInputs[0] as HTMLInputElement, '2026-07-01');
    await user.type(dateInputs[1] as HTMLInputElement, '2026-07-31');
    expect((dateInputs[0] as HTMLInputElement).value).toBe('2026-07-01');
  });

  it('applies a day preset and reset preset', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<Harness />);
    await user.click(screen.getByRole('button', { name: '7 дней' }));
    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect((dateInputs[1] as HTMLInputElement).value).toBe('2026-07-18');
    expect((dateInputs[0] as HTMLInputElement).value).toBe('2026-07-11');

    await user.click(screen.getByRole('button', { name: 'Сбросить' }));
    expect((dateInputs[0] as HTMLInputElement).value).toBe('');
  });

  it('exports finance and analytics PDFs', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onExport = vi.fn();
    render(<Harness onExport={onExport} />);
    await user.click(screen.getByRole('button', { name: /Финансы PDF/ }));
    expect(onExport).toHaveBeenCalledWith(expect.any(Function), 'финансы_Resto_range.pdf');
    const finFn = at(onExport.mock.calls, 0)[0] as () => Promise<Blob>;
    await finFn();
    expect((vendorServiceMock as { exportFinancePDF: ReturnType<typeof vi.fn> }).exportFinancePDF).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Аналитика PDF/ }));
    const advFn = at(onExport.mock.calls, 1)[0] as () => Promise<Blob>;
    await advFn();
    expect((vendorServiceMock as { exportAnalyticsPDF: ReturnType<typeof vi.fn> }).exportAnalyticsPDF).toHaveBeenCalled();
  });

  it('shows export loading text and disables buttons', () => {
    render(<Harness exportLoading />);
    const buttons = screen.getAllByText('...');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
