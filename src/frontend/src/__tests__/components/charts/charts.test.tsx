import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { KPICards } from '../../../components/dashboard/charts/KPICards';
import { RevenueChart } from '../../../components/dashboard/charts/RevenueChart';
import { AOVDynamicsChart } from '../../../components/dashboard/charts/AOVDynamicsChart';
import { TopItemsChart } from '../../../components/dashboard/charts/TopItemsChart';
import { TopRestaurantsChart } from '../../../components/dashboard/charts/TopRestaurantsChart';
import { HourlyLoadChart } from '../../../components/dashboard/charts/HourlyLoadChart';
import { CategoryRevenueChart } from '../../../components/dashboard/charts/CategoryRevenueChart';
import { OrderStatusPieChart } from '../../../components/dashboard/charts/OrderStatusPieChart';
import { UsersByRoleChart } from '../../../components/dashboard/charts/UsersByRoleChart';
import type {
  FinanceAnalytics,
  FinanceSeriesPoint,
  FinanceTopItem,
  FinanceTopRestaurant,
  AnalyticsPoint,
} from '@shared/types/models';
import { t } from '@shared/i18n/useTranslation';

type FormatterFn = (value: unknown, name?: unknown) => unknown;

vi.mock('recharts', () => {
  const Pass = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  const Axis = ({ tickFormatter }: { tickFormatter?: (v: string | number) => unknown }) => (
    <div data-testid="axis">
      {tickFormatter ? String(tickFormatter('2026-01-15')) : null}
      {tickFormatter ? String(tickFormatter(500)) : null}
    </div>
  );
  const Tooltip = ({ formatter }: { formatter?: FormatterFn }) => (
    <div data-testid="tooltip">
      {formatter ? String(formatter(42, 'label')) : null}
    </div>
  );
  const Chart = ({ children, data }: { children?: ReactNode; data?: unknown }) => (
    <div data-testid="chart" data-len={Array.isArray(data) ? data.length : 0}>
      {children}
    </div>
  );
  return {
    ResponsiveContainer: Pass,
    AreaChart: Chart,
    LineChart: Chart,
    BarChart: Chart,
    PieChart: Chart,
    Area: Pass,
    Line: Pass,
    Bar: Pass,
    Pie: Pass,
    XAxis: Axis,
    YAxis: Axis,
    CartesianGrid: Pass,
    Tooltip,
    Legend: Pass,
  };
});

const series: FinanceSeriesPoint[] = [
  { date: '2026-01-01', value: 100 },
  { date: '2026-01-02', value: 200 },
];

const points: AnalyticsPoint[] = [
  { label: '10:00', value: 5 },
  { label: '11:00', value: 8 },
];

describe('KPICards', () => {
  it('renders all KPI cards with positive growth', () => {
    const finance = {
      total_revenue: 123456,
      revenue_growth_pct: 12.5,
      total_orders: 200,
      average_check: 617,
      conversion_percent: 45,
      cancelled_orders: 10,
    } as unknown as FinanceAnalytics;
    render(<KPICards finance={finance} />);
    expect(screen.getByText(t('admin.charts.kpi.revenue'))).toBeInTheDocument();
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
    expect(screen.getByText(t('admin.charts.kpi.cancelledSub', { percent: '5.0' }))).toBeInTheDocument();
  });

  it('renders dash growth when growth is null and zero cancellation', () => {
    const finance = {
      total_revenue: 0,
      revenue_growth_pct: null,
      total_orders: 0,
      average_check: 0,
      conversion_percent: 0,
      cancelled_orders: 0,
    } as unknown as FinanceAnalytics;
    render(<KPICards finance={finance} />);
    expect(screen.getByText(t('common.states.dash'))).toBeInTheDocument();
    expect(screen.getByText(t('admin.charts.kpi.cancelledSub', { percent: 0 }))).toBeInTheDocument();
  });

  it('renders negative growth', () => {
    const finance = {
      total_revenue: 500,
      revenue_growth_pct: -8,
      total_orders: 50,
      average_check: 10,
      conversion_percent: 20,
      cancelled_orders: 2,
    } as unknown as FinanceAnalytics;
    render(<KPICards finance={finance} />);
    expect(screen.getByText('-8%')).toBeInTheDocument();
  });
});

describe('RevenueChart', () => {
  it('renders title and formats axis ticks', () => {
    render(<RevenueChart data={series} />);
    expect(screen.getByText(t('admin.charts.revenue.title'))).toBeInTheDocument();
    expect(screen.getAllByTestId('axis').length).toBeGreaterThan(0);
    expect(screen.getByText(/500₽/)).toBeInTheDocument();
  });
});

describe('AOVDynamicsChart', () => {
  it('renders title and formats ticks', () => {
    render(<AOVDynamicsChart data={series} />);
    expect(screen.getByText(t('admin.charts.aovDynamics.title'))).toBeInTheDocument();
    expect(screen.getByText(/500₽/)).toBeInTheDocument();
  });
});

describe('TopItemsChart', () => {
  it('renders with data and tooltip formatter', () => {
    const data = [
      { name: 'Pizza', quantity: 10 },
      { name: 'Burger', quantity: 5 },
    ] as unknown as FinanceTopItem[];
    render(<TopItemsChart data={data} />);
    expect(screen.getByText(t('admin.charts.topItems.title'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(t('admin.charts.topItems.soldUnits')))).toBeInTheDocument();
  });

  it('returns null when data is not an array', () => {
    const { container } = render(
      <TopItemsChart data={null as unknown as FinanceTopItem[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('TopRestaurantsChart', () => {
  it('renders with data and revenue formatter', () => {
    const data = [{ name: 'Resto', revenue: 1000 }] as unknown as FinanceTopRestaurant[];
    render(<TopRestaurantsChart data={data} />);
    expect(screen.getByText(t('admin.charts.topRestaurants.title'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(t('admin.charts.topRestaurants.revenue')))).toBeInTheDocument();
  });

  it('returns null when data is not an array', () => {
    const { container } = render(
      <TopRestaurantsChart data={null as unknown as FinanceTopRestaurant[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('HourlyLoadChart', () => {
  it('renders title', () => {
    render(<HourlyLoadChart data={points} />);
    expect(screen.getByText(t('admin.charts.hourlyLoad.title'))).toBeInTheDocument();
  });
});

describe('CategoryRevenueChart', () => {
  it('renders title with mapped colors', () => {
    render(<CategoryRevenueChart data={points} />);
    expect(screen.getByText(t('admin.charts.categoryRevenue.title'))).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });
});

describe('OrderStatusPieChart', () => {
  it('renders title with status entries', () => {
    render(<OrderStatusPieChart data={{ NEW: 3, DONE: 7 }} />);
    expect(screen.getByText(t('admin.charts.orderStatus.title'))).toBeInTheDocument();
  });

  it('renders with default empty data', () => {
    render(<OrderStatusPieChart />);
    expect(screen.getByText(t('admin.charts.orderStatus.title'))).toBeInTheDocument();
  });
});

describe('UsersByRoleChart', () => {
  it('renders role cards with computed percentages', () => {
    render(<UsersByRoleChart data={{ CUSTOMER: 80, STAFF: 15, VENDOR: 5 }} />);
    expect(screen.getByText(t('admin.charts.usersByRole.customer'))).toBeInTheDocument();
    expect(screen.getByText(t('admin.charts.usersByRole.staff'))).toBeInTheDocument();
    expect(screen.getByText(t('admin.charts.usersByRole.vendor'))).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText(t('admin.charts.usersByRole.percentOfAll', { percent: 80 }))).toBeInTheDocument();
  });

  it('renders zeros with default data', () => {
    render(<UsersByRoleChart />);
    expect(screen.getAllByText(t('admin.charts.usersByRole.percentOfAll', { percent: 0 })).length).toBe(3);
  });
});
