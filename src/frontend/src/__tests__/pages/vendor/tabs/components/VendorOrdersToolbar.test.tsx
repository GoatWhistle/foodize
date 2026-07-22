import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { VendorOrdersToolbar } from '../../../../../pages/vendor/tabs/components/VendorOrdersToolbar';
import type { Restaurant } from '@shared/types/models';
import { at } from '../../../../testUtils';
import { t } from '@shared/i18n/useTranslation';

type ToolbarProps = React.ComponentProps<typeof VendorOrdersToolbar>;

const makeProps = (overrides: Partial<ToolbarProps> = {}): ToolbarProps => ({
  ordersStatusFilter: '',
  setOrdersStatusFilter: vi.fn(),
  ordersDateFromFilter: '',
  setOrdersDateFromFilter: vi.fn(),
  ordersDateToFilter: '',
  setOrdersDateToFilter: vi.fn(),
  setOrdersPage: vi.fn(),
  ordersLoading: false,
  exportLoading: false,
  todayStr: '2026-07-18',
  selectedRestaurant: { id: 'r1' } as unknown as Restaurant,
  handleVendorExport: vi.fn(),
  fetchVendorOrders: vi.fn(),
  vendorService: { exportOrdersCSV: vi.fn(() => Promise.resolve(new Blob())) },
  ...overrides,
});

const exportCsv = (props: ToolbarProps): ReturnType<typeof vi.fn> =>
  props.vendorService.exportOrdersCSV as unknown as ReturnType<typeof vi.fn>;
const exportHandler = (props: ToolbarProps): ReturnType<typeof vi.fn> =>
  props.handleVendorExport as unknown as ReturnType<typeof vi.fn>;

describe('VendorOrdersToolbar', () => {
  it('renders header, chips and date inputs', () => {
    render(<VendorOrdersToolbar {...makeProps()} />);
    expect(screen.getByText(t('vendor.orders.toolbarTitle'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t('vendor.orders.filters.pending') })).toBeInTheDocument();
    expect(screen.getByLabelText(t('vendor.orders.dateFrom'))).toBeInTheDocument();
    expect(screen.getByLabelText(t('vendor.orders.dateTo'))).toBeInTheDocument();
  });

  it('selecting a status chip updates filter and resets page', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<VendorOrdersToolbar {...props} />);
    await user.click(screen.getByRole('button', { name: t('vendor.orders.filters.ready') }));
    expect(props.setOrdersStatusFilter).toHaveBeenCalledWith('READY');
    expect(props.setOrdersPage).toHaveBeenCalledWith(1);
  });

  it('exports CSV via handleVendorExport with correct filename', async () => {
    const user = userEvent.setup();
    const props = makeProps({ ordersStatusFilter: 'PENDING' });
    render(<VendorOrdersToolbar {...props} />);
    await user.click(screen.getByRole('button', { name: /CSV/ }));
    expect(props.handleVendorExport).toHaveBeenCalledWith(expect.any(Function), t('vendor.exportFiles.orders', { date: '2026-07-18' }));
    const exportFn = at(exportHandler(props).mock.calls, 0)[0] as () => Promise<Blob>;
    await exportFn();
    expect(exportCsv(props)).toHaveBeenCalledWith({ restaurant_id: 'r1', status: 'PENDING' });
  });

  it('refresh button calls fetchVendorOrders', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<VendorOrdersToolbar {...props} />);
    await user.click(screen.getByRole('button', { name: new RegExp(t('common.actions.refresh')) }));
    expect(props.fetchVendorOrders).toHaveBeenCalled();
  });

  it('shows loading indicators when loading', () => {
    render(<VendorOrdersToolbar {...makeProps({ ordersLoading: true, exportLoading: true })} />);
    expect(screen.getAllByText('...').length).toBeGreaterThan(0);
  });

  it('date inputs update filters and reset page', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<VendorOrdersToolbar {...props} />);
    await user.type(screen.getByLabelText(t('vendor.orders.dateFrom')), '2026-07-01');
    expect(props.setOrdersDateFromFilter).toHaveBeenCalled();
    await user.type(screen.getByLabelText(t('vendor.orders.dateTo')), '2026-07-31');
    expect(props.setOrdersDateToFilter).toHaveBeenCalled();
  });

  it('shows and clicks reset period button when a date is set', async () => {
    const user = userEvent.setup();
    const props = makeProps({ ordersDateFromFilter: '2026-07-01' });
    render(<VendorOrdersToolbar {...props} />);
    await user.click(screen.getByRole('button', { name: t('vendor.orders.resetPeriod') }));
    expect(props.setOrdersDateFromFilter).toHaveBeenCalledWith('');
    expect(props.setOrdersDateToFilter).toHaveBeenCalledWith('');
    expect(props.setOrdersPage).toHaveBeenCalledWith(1);
  });

  it('exports with undefined ids when no restaurant/status', async () => {
    const user = userEvent.setup();
    const props = makeProps({ selectedRestaurant: null, ordersStatusFilter: '' });
    render(<VendorOrdersToolbar {...props} />);
    await user.click(screen.getByRole('button', { name: /CSV/ }));
    const exportFn = at(exportHandler(props).mock.calls, 0)[0] as () => Promise<Blob>;
    await exportFn();
    expect(exportCsv(props)).toHaveBeenCalledWith({ restaurant_id: undefined, status: undefined });
  });
});
