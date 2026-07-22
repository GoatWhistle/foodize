import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { AdminFinanceTab } from '../../../../pages/admin/tabs/AdminFinanceTab';
import type {
  FinanceAnalytics,
  AdvancedAnalytics,
  AdminRestaurant,
  FinanceFilters,
} from '../../../../pages/admin/hooks/useAdminFinance';
import type { adminService as adminServiceType } from '../../../../services/adminService';
import { t } from '@shared/i18n/useTranslation';
import { at, req } from '../../../testUtils';

vi.mock('../../../../components/dashboard/DashboardCharts', () => ({
  RevenueChart: () => <div data-testid="revenue-chart" />,
  HourlyLoadChart: () => <div data-testid="hourly-chart" />,
  CategoryRevenueChart: ({ data }: { data: { label: string }[] }) => (
    <div data-testid="category-chart">{data.map((d) => d.label).join(',')}</div>
  ),
  AOVDynamicsChart: () => <div data-testid="aov-chart" />,
  KPICards: () => <div data-testid="kpi" />,
  TopItemsChart: () => <div data-testid="top-items" />,
  TopRestaurantsChart: () => <div data-testid="top-restaurants" />,
}));

const finance: FinanceAnalytics = {
  revenue_by_day: [],
  top_items: [],
  top_restaurants: [],
} as unknown as FinanceAnalytics;

const advanced: AdvancedAnalytics = {
  aov_dynamics: [],
  category_revenue: [{ label: 'pizza', value: 10 }],
  hourly_load: [],
} as unknown as AdvancedAnalytics;

const restaurants: AdminRestaurant[] = [
  { id: 'r1', name: 'Пицца' },
] as unknown as AdminRestaurant[];

const adminService = {
  exportFinancePDF: vi.fn(() => Promise.resolve(new Blob())),
  exportAnalyticsPDF: vi.fn(() => Promise.resolve(new Blob())),
  exportOverviewPDF: vi.fn(() => Promise.resolve(new Blob())),
} as unknown as typeof adminServiceType;

const baseProps = (over: Partial<Parameters<typeof AdminFinanceTab>[0]> = {}) => ({
  finance,
  financeLoading: false,
  advancedAnalytics: advanced,
  analyticsLoading: false,
  financeFilters: { date_from: '', date_to: '', restaurant_id: '' },
  setFinanceFilters: vi.fn(),
  activePreset: null as number | null,
  setActivePreset: vi.fn(),
  allRestaurants: restaurants,
  exportLoading: false,
  handleExport: vi.fn(),
  todayStr: '2026-07-18',
  adminService,
  getRestaurantLabel: () => 'все',
  getDateRangeLabel: () => '2026-07-18_2026-07-18',
  ...over,
});

describe('AdminFinanceTab', () => {
  it('renders skeleton while loading with no finance', () => {
    render(<AdminFinanceTab {...baseProps({ finance: null, financeLoading: true })} />);
    expect(screen.queryByTestId('kpi')).not.toBeInTheDocument();
  });

  it('renders charts and restaurant options', () => {
    render(<AdminFinanceTab {...baseProps()} />);
    expect(screen.getByTestId('kpi')).toBeInTheDocument();
    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
    expect(screen.getByTestId('top-restaurants')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Пицца' })).toBeInTheDocument();
    expect(screen.getByTestId('category-chart')).toBeInTheDocument();
  });

  it('updates date_from and date_to clearing preset', () => {
    const setFinanceFilters = vi.fn();
    const setActivePreset = vi.fn();
    const { container } = render(
      <AdminFinanceTab {...baseProps({ setFinanceFilters, setActivePreset })} />,
    );
    const dates = container.querySelectorAll('input[type="date"]');
    fireEvent.change(at(dates, 0), { target: { value: '2026-01-01' } });
    fireEvent.change(at(dates, 1), { target: { value: '2026-02-01' } });
    expect(setActivePreset).toHaveBeenCalledWith(null);
    expect(setFinanceFilters).toHaveBeenCalledWith(
      expect.objectContaining({ date_from: '2026-01-01' }),
    );
    expect(setFinanceFilters).toHaveBeenLastCalledWith(
      expect.objectContaining({ date_to: '2026-02-01' }),
    );
  });

  it('selects a restaurant filter', async () => {
    const setFinanceFilters = vi.fn();
    render(<AdminFinanceTab {...baseProps({ setFinanceFilters })} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'r1');
    expect(setFinanceFilters).toHaveBeenCalledWith(
      expect.objectContaining({ restaurant_id: 'r1' }),
    );
  });

  it('applies a day preset and reset preset', async () => {
    const setFinanceFilters = vi.fn();
    const setActivePreset = vi.fn();
    render(<AdminFinanceTab {...baseProps({ setFinanceFilters, setActivePreset })} />);
    await userEvent.click(screen.getByRole('button', { name: t('admin.finance.presets.days7') }));
    expect(setActivePreset).toHaveBeenCalledWith(7);
    let updater = req(setFinanceFilters.mock.calls.at(-1))[0] as (p: FinanceFilters) => FinanceFilters;
    let next = updater({ date_from: '', date_to: '', restaurant_id: '' });
    expect(next.date_from).toBeTruthy();
    expect(next.date_to).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: t('admin.finance.presets.reset') }));
    expect(setActivePreset).toHaveBeenCalledWith(null);
    updater = req(setFinanceFilters.mock.calls.at(-1))[0] as (p: FinanceFilters) => FinanceFilters;
    next = updater({ date_from: 'x', date_to: 'y', restaurant_id: 'z' });
    expect(next.date_from).toBe('');
    expect(next.date_to).toBe('');
  });

  it('triggers export actions', async () => {
    const handleExport = vi.fn();
    render(<AdminFinanceTab {...baseProps({ handleExport })} />);
    await userEvent.click(
      screen.getByRole('button', { name: t('admin.finance.exports.financePdf') }),
    );
    expect(handleExport).toHaveBeenCalledWith(
      expect.any(Function),
      t('admin.exportFiles.finance', { restaurant: 'все', range: '2026-07-18_2026-07-18' }),
    );
    const exportFn = at(handleExport.mock.calls, 0)[0] as () => Promise<Blob>;
    void exportFn();
    expect(adminService.exportFinancePDF).toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: t('admin.finance.exports.analyticsPdf') }),
    );
    void (req(handleExport.mock.calls.at(-1))[0] as () => Promise<Blob>)();
    expect(adminService.exportAnalyticsPDF).toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: t('admin.finance.exports.overviewPdf') }),
    );
    void (req(handleExport.mock.calls.at(-1))[0] as () => Promise<Blob>)();
    expect(adminService.exportOverviewPDF).toHaveBeenCalled();
  });

  it('disables exports and shows ellipsis when loading', () => {
    render(<AdminFinanceTab {...baseProps({ exportLoading: true })} />);
    expect(screen.getAllByText('...').length).toBeGreaterThan(0);
  });

  it('hides top restaurants and offers reset when restaurant filter active', async () => {
    const setFinanceFilters = vi.fn();
    render(
      <AdminFinanceTab
        {...baseProps({
          setFinanceFilters,
          financeFilters: { date_from: '', date_to: '', restaurant_id: 'r1' },
        })}
      />,
    );
    expect(screen.queryByTestId('top-restaurants')).not.toBeInTheDocument();
    expect(screen.getByText(t('admin.finance.topRestaurantsHidden'))).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: t('admin.finance.resetFilter') }));
    const updater = req(setFinanceFilters.mock.calls.at(-1))[0] as (p: FinanceFilters) => FinanceFilters;
    expect(updater({ date_from: '', date_to: '', restaurant_id: 'r1' }).restaurant_id).toBe('');
  });

  it('renders without advanced analytics', () => {
    render(<AdminFinanceTab {...baseProps({ advancedAnalytics: null })} />);
    expect(screen.queryByTestId('aov-chart')).not.toBeInTheDocument();
    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
  });
});
