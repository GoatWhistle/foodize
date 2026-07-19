import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage';
import { useAdminDashboard } from '../../pages/admin/useAdminDashboard';

vi.mock('../../services/adminService', () => ({
  adminService: {
    exportUsersCSV: vi.fn(),
    exportVendorsCSV: vi.fn(),
    exportRestaurantsCSV: vi.fn(),
    exportReviewsCSV: vi.fn(),
    exportOrdersCSV: vi.fn(),
  },
}));

vi.mock('../../pages/admin/useAdminDashboard', () => ({
  useAdminDashboard: vi.fn(),
  PAGE_SIZE: 20,
}));

vi.mock('../../pages/admin/components/AdminSidebar', () => ({
  AdminSidebar: ({ setActiveTab, setEntitiesOpen }: {
    setActiveTab: (t: string) => void;
    setEntitiesOpen: (v: boolean) => void;
  }) => (
    <div>
      <button onClick={() => { setActiveTab('finance'); }}>go-finance</button>
      <button onClick={() => { setEntitiesOpen(true); }}>open-entities</button>
    </div>
  ),
}));

vi.mock('../../pages/admin/components/AdminBatchBars', () => ({
  AdminBatchBars: () => <div data-testid="batch-bars" />,
}));

vi.mock('../../pages/admin/tabs/AdminStatsTab', () => ({
  AdminStatsTab: ({ setActiveTab }: { setActiveTab: (t: string) => void }) => (
    <button onClick={() => { setActiveTab('finance'); }}>stats-tab</button>
  ),
}));

vi.mock('../../pages/admin/tabs/AdminFinanceTab', () => ({
  AdminFinanceTab: ({ handleExport, getRestaurantLabel, getDateRangeLabel }: {
    handleExport: (fn: () => Promise<Blob>, name: string) => void;
    getRestaurantLabel: () => string;
    getDateRangeLabel: () => string;
  }) => (
    <button onClick={() => { handleExport(() => Promise.resolve(new Blob()), 'f.csv'); getRestaurantLabel(); getDateRangeLabel(); }}>
      finance-tab
    </button>
  ),
}));

vi.mock('../../pages/admin/tabs/AdminAuditTab', () => ({
  AdminAuditTab: () => <div data-testid="audit-tab" />,
}));

vi.mock('../../pages/admin/tabs/AdminUsersTab', () => ({
  AdminUsersTab: ({ handleExport, loadUserDetails }: {
    handleExport: (fn: () => Promise<Blob>, name: string) => void;
    loadUserDetails: (id: string) => void;
  }) => (
    <button onClick={() => { handleExport(() => Promise.resolve(new Blob()), 'u.csv'); loadUserDetails('u1'); }}>
      users-tab
    </button>
  ),
}));

vi.mock('../../pages/admin/tabs/AdminOrdersTab', () => ({
  AdminOrdersTab: ({ handleExport }: { handleExport: (fn: () => Promise<Blob>, name: string) => void }) => (
    <button onClick={() => { handleExport(() => Promise.resolve(new Blob()), 'o.csv'); }}>orders-tab</button>
  ),
}));

vi.mock('../../pages/admin/tabs/AdminResolutionTab', () => ({
  AdminResolutionTab: ({ setActionError }: { setActionError: (v: string) => void }) => (
    <button onClick={() => { setActionError('x'); }}>resolution-tab</button>
  ),
}));

vi.mock('../../pages/admin/tabs/AdminRestaurantsTab', () => ({
  AdminRestaurantsTab: ({ handleExport, loadRestaurantDetails }: {
    handleExport: (fn: () => Promise<Blob>, name: string) => void;
    loadRestaurantDetails: (id: string) => void;
  }) => (
    <button onClick={() => { handleExport(() => Promise.resolve(new Blob()), 'r.csv'); loadRestaurantDetails('r1'); }}>
      restaurants-tab
    </button>
  ),
}));

vi.mock('../../pages/admin/tabs/AdminVendorsTab', () => ({
  AdminVendorsTab: ({ handleExport, loadVendorDetails }: {
    handleExport: (fn: () => Promise<Blob>, name: string) => void;
    loadVendorDetails: (id: string) => void;
  }) => (
    <button onClick={() => { handleExport(() => Promise.resolve(new Blob()), 'v.csv'); loadVendorDetails('v1'); }}>
      vendors-tab
    </button>
  ),
}));

vi.mock('../../pages/admin/tabs/AdminReviewsTab', () => ({
  AdminReviewsTab: ({ handleExport }: { handleExport: (fn: () => Promise<Blob>, name: string) => void }) => (
    <button onClick={() => { handleExport(() => Promise.resolve(new Blob()), 'rev.csv'); }}>reviews-tab</button>
  ),
}));

vi.mock('../../pages/admin/tabs/AdminDetailModals', () => ({
  AdminDetailModals: ({ handleActivateUser, handleApproveRestaurant }: {
    handleActivateUser: (id: string) => void;
    handleApproveRestaurant: (id: string) => void;
  }) => (
    <div>
      <button onClick={() => { handleActivateUser('u1'); }}>activate-user</button>
      <button onClick={() => { handleApproveRestaurant('r1'); }}>approve-restaurant</button>
    </div>
  ),
  ReasonDialog: ({ onConfirm, onCancel }: {
    onConfirm: (reason: string) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button onClick={() => { onConfirm('because'); }}>reason-confirm</button>
      <button onClick={onCancel}>reason-cancel</button>
    </div>
  ),
}));

vi.mock('../../components/QRCodeModal/QRCodeModal', () => ({
  QRCodeModal: ({ onClose }: { onClose: () => void }) => (
    <button onClick={onClose}>close-qr</button>
  ),
}));

const baseDashboard = () => {
  const setActiveTab = vi.fn();
  const setEntitiesOpen = vi.fn();
  const handleExport = vi.fn();
  const loadUserDetails = vi.fn();
  const loadRestaurantDetails = vi.fn();
  const loadVendorDetails = vi.fn();
  const handleActivateUser = vi.fn();
  const handleApproveRestaurant = vi.fn();
  const setReasonDialog = vi.fn();
  const runReasonAction = vi.fn();
  const setQrRestaurant = vi.fn();
  const getRestaurantLabel = vi.fn(() => 'label');
  const getDateRangeLabel = vi.fn(() => 'range');
  return {
    dashboard: {
      currentUser: { id: 'admin' },
      activeTab: 'stats',
      setActiveTab,
      entitiesOpen: true,
      setEntitiesOpen,
      stats: null,
      actionError: '',
      actionSuccess: '',
      ordersByStatusChartData: null,
      finance: null,
      financeLoading: false,
      advancedAnalytics: null,
      analyticsLoading: false,
      financeFilters: {},
      setFinanceFilters: vi.fn(),
      activePreset: '',
      setActivePreset: vi.fn(),
      allRestaurants: [],
      exportLoading: false,
      handleExport,
      todayStr: '2026-07-18',
      getRestaurantLabel,
      getDateRangeLabel,
      auditLogs: [], auditLoading: false, auditTotal: 0, auditPage: 1, setAuditPage: vi.fn(),
      auditFilters: {}, setAuditFilters: vi.fn(), expandedAuditId: null, setExpandedAuditId: vi.fn(),
      users: [], usersLoading: false, usersTotal: 0, usersPage: 1, setUsersPage: vi.fn(),
      userSearchRaw: '', setUserSearchRaw: vi.fn(), userFilters: {}, setUserFilters: vi.fn(),
      selectedUserIds: new Set(), setSelectedUserIds: vi.fn(),
      loadUserDetails, handleDeleteUser: vi.fn(),
      orders: [], ordersLoading: false, ordersTotal: 0, ordersPage: 1, setOrdersPage: vi.fn(),
      orderSearchRaw: '', setOrderSearchRaw: vi.fn(), orderFilters: {}, setOrderFilters: vi.fn(),
      setSelectedOrder: vi.fn(), selectedOrder: null,
      setReasonDialog, reasonDialog: null, reasonLoading: false, runReasonAction,
      restaurants: [], restaurantsLoading: false, restaurantsTotal: 0, restaurantsPage: 1, setRestaurantsPage: vi.fn(),
      restaurantSearchRaw: '', setRestaurantSearchRaw: vi.fn(),
      restaurantVendorSearchRaw: '', setRestaurantVendorSearchRaw: vi.fn(),
      restaurantFilters: {}, setRestaurantFilters: vi.fn(),
      selectedRestaurantIds: new Set(), setSelectedRestaurantIds: vi.fn(),
      loadRestaurantDetails,
      vendors: [], vendorsLoading: false, vendorsTotal: 0, vendorsPage: 1, setVendorsPage: vi.fn(),
      vendorSearchRaw: '', setVendorSearchRaw: vi.fn(), vendorFilters: {}, setVendorFilters: vi.fn(),
      selectedVendorIds: new Set(), setSelectedVendorIds: vi.fn(), loadVendorDetails,
      reviews: [], reviewsLoading: false, reviewsTotal: 0, reviewsPage: 1, setReviewsPage: vi.fn(),
      reviewFilters: {}, setReviewFilters: vi.fn(),
      selectedReviewIds: new Set(), setSelectedReviewIds: vi.fn(), handleDeleteReview: vi.fn(),
      selectedUser: null, setSelectedUser: vi.fn(), userDetailsLoading: false,
      permissionActionLoading: false, handleSetPermissionPreset: vi.fn(), handleMakeAdmin: vi.fn(),
      handleActivateUser,
      selectedRestaurant: null, setSelectedRestaurant: vi.fn(), restaurantDetailsLoading: false,
      approveLoading: false, handleApproveRestaurant, handleRejectRestaurant: vi.fn(), handleDeleteRestaurant: vi.fn(),
      setQrType: vi.fn(), setQrRestaurant,
      selectedVendor: null, setSelectedVendor: vi.fn(), vendorDetailsLoading: false,
      handleApproveVendor: vi.fn(), handleRejectVendor: vi.fn(), handleDeleteVendor: vi.fn(),
      qrRestaurant: null, qrType: 'site' as const,
    },
    spies: {
      setActiveTab, setEntitiesOpen, handleExport, loadUserDetails, loadRestaurantDetails,
      loadVendorDetails, handleActivateUser, handleApproveRestaurant, setReasonDialog,
      runReasonAction, setQrRestaurant,
    },
  };
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminDashboardPage />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminDashboardPage wiring', () => {
  it('shows the error banner when actionError is set', () => {
    const { dashboard } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue({ ...dashboard, actionError: 'Ошибка!' } as never);
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('Ошибка!');
  });

  it('shows the success banner when actionSuccess is set', () => {
    const { dashboard } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue({ ...dashboard, actionSuccess: 'Готово!' } as never);
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Готово!');
  });

  it('renders finance tab and wires its export + label helpers', async () => {
    const user = userEvent.setup();
    const { dashboard, spies } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue({ ...dashboard, activeTab: 'finance' } as never);
    renderPage();
    await user.click(screen.getByText('finance-tab'));
    expect(spies.handleExport).toHaveBeenCalled();
  });

  it('renders users tab and wires export + details', async () => {
    const user = userEvent.setup();
    const { dashboard, spies } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue({ ...dashboard, activeTab: 'users' } as never);
    renderPage();
    await user.click(screen.getByText('users-tab'));
    expect(spies.handleExport).toHaveBeenCalled();
    expect(spies.loadUserDetails).toHaveBeenCalledWith('u1');
  });

  it('renders orders tab and wires export', async () => {
    const user = userEvent.setup();
    const { dashboard, spies } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue({ ...dashboard, activeTab: 'orders' } as never);
    renderPage();
    await user.click(screen.getByText('orders-tab'));
    expect(spies.handleExport).toHaveBeenCalled();
  });

  it('renders resolution tab', async () => {
    const user = userEvent.setup();
    const { dashboard } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue({ ...dashboard, activeTab: 'resolution' } as never);
    renderPage();
    await user.click(screen.getByText('resolution-tab'));
    expect(screen.getByText('resolution-tab')).toBeInTheDocument();
  });

  it('renders restaurants tab and wires export + details', async () => {
    const user = userEvent.setup();
    const { dashboard, spies } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue({ ...dashboard, activeTab: 'restaurants' } as never);
    renderPage();
    await user.click(screen.getByText('restaurants-tab'));
    expect(spies.loadRestaurantDetails).toHaveBeenCalledWith('r1');
  });

  it('renders vendors tab and wires export + details', async () => {
    const user = userEvent.setup();
    const { dashboard, spies } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue({ ...dashboard, activeTab: 'vendors' } as never);
    renderPage();
    await user.click(screen.getByText('vendors-tab'));
    expect(spies.loadVendorDetails).toHaveBeenCalledWith('v1');
  });

  it('renders reviews tab and wires export', async () => {
    const user = userEvent.setup();
    const { dashboard, spies } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue({ ...dashboard, activeTab: 'reviews' } as never);
    renderPage();
    await user.click(screen.getByText('reviews-tab'));
    expect(spies.handleExport).toHaveBeenCalled();
  });

  it('renders audit tab', () => {
    const { dashboard } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue({ ...dashboard, activeTab: 'audit' } as never);
    renderPage();
    expect(screen.getByTestId('audit-tab')).toBeInTheDocument();
  });

  it('wires detail modal activate and approve callbacks', async () => {
    const user = userEvent.setup();
    const { dashboard, spies } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue(dashboard as never);
    renderPage();
    await user.click(screen.getByText('activate-user'));
    await user.click(screen.getByText('approve-restaurant'));
    expect(spies.handleActivateUser).toHaveBeenCalledWith('u1');
    expect(spies.handleApproveRestaurant).toHaveBeenCalledWith('r1');
  });

  it('wires the reason dialog confirm and cancel', async () => {
    const user = userEvent.setup();
    const { dashboard, spies } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue(dashboard as never);
    renderPage();
    await user.click(screen.getByText('reason-confirm'));
    expect(spies.runReasonAction).toHaveBeenCalledWith('because');
    await user.click(screen.getByText('reason-cancel'));
    expect(spies.setReasonDialog).toHaveBeenCalledWith(null);
  });

  it('renders the QR modal and closes it', async () => {
    const user = userEvent.setup();
    const { dashboard, spies } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue({
      ...dashboard,
      qrRestaurant: { id: 'r1', display_id: 'x', name: 'R' },
    } as never);
    renderPage();
    await user.click(screen.getByText('close-qr'));
    expect(spies.setQrRestaurant).toHaveBeenCalledWith(null);
  });

  it('does not render the QR modal when no qrRestaurant', () => {
    const { dashboard } = baseDashboard();
    vi.mocked(useAdminDashboard).mockReturnValue(dashboard as never);
    renderPage();
    expect(screen.queryByText('close-qr')).not.toBeInTheDocument();
  });
});
