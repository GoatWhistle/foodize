import { vi } from 'vitest';

export const MockAdminSidebar = ({ setActiveTab, setEntitiesOpen }: {
  setActiveTab: (t: string) => void;
  setEntitiesOpen: (v: boolean) => void;
}) => (
  <div>
    <button onClick={() => { setActiveTab('finance'); }}>go-finance</button>
    <button onClick={() => { setEntitiesOpen(true); }}>open-entities</button>
  </div>
);

export const MockAdminBatchBars = () => <div data-testid="batch-bars" />;

export const MockAdminStatsTab = ({ setActiveTab }: { setActiveTab: (t: string) => void }) => (
  <button onClick={() => { setActiveTab('finance'); }}>stats-tab</button>
);

export const MockAdminFinanceTab = ({ handleExport, getRestaurantLabel, getDateRangeLabel }: {
  handleExport: (fn: () => Promise<Blob>, name: string) => void;
  getRestaurantLabel: () => string;
  getDateRangeLabel: () => string;
}) => (
  <button onClick={() => { handleExport(() => Promise.resolve(new Blob()), 'f.csv'); getRestaurantLabel(); getDateRangeLabel(); }}>
    finance-tab
  </button>
);

export const MockAdminAuditTab = () => <div data-testid="audit-tab" />;

export const MockAdminUsersTab = ({ handleExport, loadUserDetails }: {
  handleExport: (fn: () => Promise<Blob>, name: string) => void;
  loadUserDetails: (id: string) => void;
}) => (
  <button onClick={() => { handleExport(() => Promise.resolve(new Blob()), 'u.csv'); loadUserDetails('u1'); }}>
    users-tab
  </button>
);

export const MockAdminOrdersTab = ({ handleExport }: { handleExport: (fn: () => Promise<Blob>, name: string) => void }) => (
  <button onClick={() => { handleExport(() => Promise.resolve(new Blob()), 'o.csv'); }}>orders-tab</button>
);

export const MockAdminResolutionTab = ({ setActionError }: { setActionError: (v: string) => void }) => (
  <button onClick={() => { setActionError('x'); }}>resolution-tab</button>
);

export const MockAdminRestaurantsTab = ({ handleExport, loadRestaurantDetails }: {
  handleExport: (fn: () => Promise<Blob>, name: string) => void;
  loadRestaurantDetails: (id: string) => void;
}) => (
  <button onClick={() => { handleExport(() => Promise.resolve(new Blob()), 'r.csv'); loadRestaurantDetails('r1'); }}>
    restaurants-tab
  </button>
);

export const MockAdminVendorsTab = ({ handleExport, loadVendorDetails }: {
  handleExport: (fn: () => Promise<Blob>, name: string) => void;
  loadVendorDetails: (id: string) => void;
}) => (
  <button onClick={() => { handleExport(() => Promise.resolve(new Blob()), 'v.csv'); loadVendorDetails('v1'); }}>
    vendors-tab
  </button>
);

export const MockAdminReviewsTab = ({ handleExport }: { handleExport: (fn: () => Promise<Blob>, name: string) => void }) => (
  <button onClick={() => { handleExport(() => Promise.resolve(new Blob()), 'rev.csv'); }}>reviews-tab</button>
);

export const MockAdminDetailModals = ({ handleActivateUser, handleApproveRestaurant }: {
  handleActivateUser: (id: string) => void;
  handleApproveRestaurant: (id: string) => void;
}) => (
  <div>
    <button onClick={() => { handleActivateUser('u1'); }}>activate-user</button>
    <button onClick={() => { handleApproveRestaurant('r1'); }}>approve-restaurant</button>
  </div>
);

export const MockReasonDialog = ({ onConfirm, onCancel }: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) => (
  <div>
    <button onClick={() => { onConfirm('because'); }}>reason-confirm</button>
    <button onClick={onCancel}>reason-cancel</button>
  </div>
);

export const MockQRCodeModal = ({ onClose }: { onClose: () => void }) => (
  <button onClick={onClose}>close-qr</button>
);

export const mockAdminServiceExports = {
  adminService: {
    exportUsersCSV: vi.fn(),
    exportVendorsCSV: vi.fn(),
    exportRestaurantsCSV: vi.fn(),
    exportReviewsCSV: vi.fn(),
    exportOrdersCSV: vi.fn(),
  },
};

export const baseDashboard = () => {
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
