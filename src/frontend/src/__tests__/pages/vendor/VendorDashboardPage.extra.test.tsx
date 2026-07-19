import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { VendorDashboardPage } from '../../../pages/vendor/VendorDashboardPage';

const dashboardMock = vi.hoisted((): { current: Record<string, unknown> } => ({ current: {} }));

vi.mock('../../../pages/vendor/useVendorDashboard', () => ({
  useVendorDashboard: () => dashboardMock.current,
}));
vi.mock('../../../pages/vendor/VendorRestaurantList', () => ({
  VendorRestaurantList: (props: { handleCreateRestaurant: (e: unknown) => void }) => (
    <button onClick={() => { props.handleCreateRestaurant({ preventDefault: () => undefined }); }}>
      CREATE_RESTAURANT
    </button>
  ),
}));
vi.mock('../../../pages/vendor/VendorSidebar', () => ({
  VendorSidebar: () => <div>SIDEBAR</div>,
}));
vi.mock('../../../pages/vendor/VendorApprovalBanner', () => ({
  VendorApprovalBanner: () => <div>BANNER</div>,
}));
vi.mock('../../../pages/vendor/components/VendorTabContent', () => ({
  VendorTabContent: (props: {
    getVendorRestaurantLabel: () => string;
    getVendorDateRange: () => string;
    handleVendorExport: (fn: () => unknown, name: string) => void;
    getOrderDisplayId: (o: unknown) => unknown;
    formatOrderTime: (v?: string | null) => string;
    groupedRestaurantOrders: unknown[];
  }) => (
    <div>
      <span data-testid="label">{props.getVendorRestaurantLabel()}</span>
      <span data-testid="range">{props.getVendorDateRange()}</span>
      <span data-testid="displayId">
        {String(props.getOrderDisplayId({ display_id: 77 }))}
      </span>
      <span data-testid="time-empty">{props.formatOrderTime(null)}</span>
      <span data-testid="time">{props.formatOrderTime('2026-01-15T09:30:00Z')}</span>
      <span data-testid="groups">{props.groupedRestaurantOrders.length}</span>
      <button onClick={() => { props.handleVendorExport(() => Promise.resolve(new Blob()), 'f.csv'); }}>
        EXPORT
      </button>
    </div>
  ),
}));
vi.mock('../../../components/QRCodeModal/QRCodeModal', () => ({
  QRCodeModal: (props: { onClose: () => void }) => (
    <button onClick={props.onClose}>QR_MODAL</button>
  ),
}));

const today = new Date();
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const makeDashboard = (over: Record<string, unknown> = {}) => ({
  selectedRestaurant: { id: 'r1', name: 'My Resto' },
  restaurants: [],
  restaurantOrders: [],
  loading: false,
  vendorProfile: null,
  showAddRestaurant: false,
  newRestaurant: {},
  formError: '',
  formLoading: false,
  activeTab: 'menu',
  showQr: false,
  qrType: 'site',
  financeFilters: { date_from: '', date_to: '' },
  setSelectedRestaurant: vi.fn(),
  setShowAddRestaurant: vi.fn(),
  setNewRestaurant: vi.fn(),
  handleCreateRestaurant: vi.fn(),
  setActiveTab: vi.fn(),
  setEditRestaurant: vi.fn(),
  setQrType: vi.fn(),
  setShowQr: vi.fn(),
  handleVendorExport: vi.fn(),
  ...over,
});

describe('VendorDashboardPage helpers and branches', () => {
  beforeEach(() => {
    dashboardMock.current = makeDashboard();
  });

  it('renders header, banner and restaurant list', () => {
    render(<VendorDashboardPage />);
    expect(screen.getByText('Дашборд вендора')).toBeInTheDocument();
    expect(screen.getByText('BANNER')).toBeInTheDocument();
    expect(screen.getByText('CREATE_RESTAURANT')).toBeInTheDocument();
  });

  it('renders sidebar and tab content when restaurant selected', () => {
    render(<VendorDashboardPage />);
    expect(screen.getByText('SIDEBAR')).toBeInTheDocument();
    expect(screen.getByTestId('label')).toHaveTextContent('My_Resto');
  });

  it('hides sidebar when no restaurant selected', () => {
    dashboardMock.current = makeDashboard({ selectedRestaurant: null });
    render(<VendorDashboardPage />);
    expect(screen.queryByText('SIDEBAR')).not.toBeInTheDocument();
  });

  it('formats order time and empty value', () => {
    render(<VendorDashboardPage />);
    expect(screen.getByTestId('time-empty')).toHaveTextContent('');
    expect(screen.getByTestId('time').textContent).not.toBe('');
    expect(screen.getByTestId('displayId')).toHaveTextContent('77');
  });

  it('builds date range from filters default today', () => {
    render(<VendorDashboardPage />);
    expect(screen.getByTestId('range')).toHaveTextContent(`${isoDay(today)}_${isoDay(today)}`);
  });

  it('builds date range from explicit filters', () => {
    dashboardMock.current = makeDashboard({
      financeFilters: { date_from: '2026-01-01', date_to: '2026-01-31' },
    });
    render(<VendorDashboardPage />);
    expect(screen.getByTestId('range')).toHaveTextContent('2026-01-01_2026-01-31');
  });

  it('groups restaurant orders by today, yesterday, unknown and other days', () => {
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    dashboardMock.current = makeDashboard({
      restaurantOrders: [
        { display_id: 1, created_at: `${isoDay(today)}T10:00:00Z` },
        { display_id: 2, created_at: `${isoDay(today)}T11:00:00Z` },
        { display_id: 3, created_at: `${isoDay(yesterday)}T10:00:00Z` },
        { display_id: 4, created_at: '2020-05-05T10:00:00Z' },
        { display_id: 5, created_at: null },
      ],
    });
    render(<VendorDashboardPage />);
    expect(screen.getByTestId('groups')).toHaveTextContent('4');
  });

  it('handles non-array orders gracefully', () => {
    dashboardMock.current = makeDashboard({ restaurantOrders: null });
    render(<VendorDashboardPage />);
    expect(screen.getByTestId('groups')).toHaveTextContent('0');
  });

  it('uses fallback restaurant label when name missing', () => {
    dashboardMock.current = makeDashboard({ selectedRestaurant: { id: 'r1', name: '' } });
    render(<VendorDashboardPage />);
    expect(screen.getByTestId('label')).toHaveTextContent('все');
  });

  it('invokes create restaurant handler', async () => {
    render(<VendorDashboardPage />);
    await userEvent.click(screen.getByText('CREATE_RESTAURANT'));
    expect(dashboardMock.current['handleCreateRestaurant'] as Mock).toHaveBeenCalled();
  });

  it('invokes vendor export handler', async () => {
    render(<VendorDashboardPage />);
    await userEvent.click(screen.getByText('EXPORT'));
    expect(dashboardMock.current['handleVendorExport'] as Mock).toHaveBeenCalledWith(
      expect.any(Function),
      'f.csv',
    );
  });

  it('renders QR modal when showQr and closes it', async () => {
    dashboardMock.current = makeDashboard({ showQr: true });
    render(<VendorDashboardPage />);
    await userEvent.click(screen.getByText('QR_MODAL'));
    expect(dashboardMock.current['setShowQr'] as Mock).toHaveBeenCalledWith(false);
  });
});
