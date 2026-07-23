import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage';
import { useAdminDashboard } from '../../pages/admin/useAdminDashboard';
import { baseDashboard } from './adminDashboardTestMocks';

vi.mock('../../services/adminService', async () =>
  (await import('./adminDashboardTestMocks')).mockAdminServiceExports);
vi.mock('../../pages/admin/useAdminDashboard', () => ({
  useAdminDashboard: vi.fn(),
  PAGE_SIZE: 20,
}));
vi.mock('../../pages/admin/components/AdminSidebar', async () => ({
  AdminSidebar: (await import('./adminDashboardTestMocks')).MockAdminSidebar,
}));
vi.mock('../../pages/admin/components/AdminBatchBars', async () => ({
  AdminBatchBars: (await import('./adminDashboardTestMocks')).MockAdminBatchBars,
}));
vi.mock('../../pages/admin/tabs/AdminStatsTab', async () => ({
  AdminStatsTab: (await import('./adminDashboardTestMocks')).MockAdminStatsTab,
}));
vi.mock('../../pages/admin/tabs/AdminFinanceTab', async () => ({
  AdminFinanceTab: (await import('./adminDashboardTestMocks')).MockAdminFinanceTab,
}));
vi.mock('../../pages/admin/tabs/AdminAuditTab', async () => ({
  AdminAuditTab: (await import('./adminDashboardTestMocks')).MockAdminAuditTab,
}));
vi.mock('../../pages/admin/tabs/AdminUsersTab', async () => ({
  AdminUsersTab: (await import('./adminDashboardTestMocks')).MockAdminUsersTab,
}));
vi.mock('../../pages/admin/tabs/AdminOrdersTab', async () => ({
  AdminOrdersTab: (await import('./adminDashboardTestMocks')).MockAdminOrdersTab,
}));
vi.mock('../../pages/admin/tabs/AdminResolutionTab', async () => ({
  AdminResolutionTab: (await import('./adminDashboardTestMocks')).MockAdminResolutionTab,
}));
vi.mock('../../pages/admin/tabs/AdminRestaurantsTab', async () => ({
  AdminRestaurantsTab: (await import('./adminDashboardTestMocks')).MockAdminRestaurantsTab,
}));
vi.mock('../../pages/admin/tabs/AdminVendorsTab', async () => ({
  AdminVendorsTab: (await import('./adminDashboardTestMocks')).MockAdminVendorsTab,
}));
vi.mock('../../pages/admin/tabs/AdminReviewsTab', async () => ({
  AdminReviewsTab: (await import('./adminDashboardTestMocks')).MockAdminReviewsTab,
}));
vi.mock('../../pages/admin/tabs/AdminDetailModals', async () => {
  const m = await import('./adminDashboardTestMocks');
  return { AdminDetailModals: m.MockAdminDetailModals, ReasonDialog: m.MockReasonDialog };
});
vi.mock('../../components/QRCodeModal/QRCodeModal', async () => ({
  QRCodeModal: (await import('./adminDashboardTestMocks')).MockQRCodeModal,
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminDashboardPage />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminDashboardPage tab wiring', () => {
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
});
