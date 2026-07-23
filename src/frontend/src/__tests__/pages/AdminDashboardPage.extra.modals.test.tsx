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

describe('AdminDashboardPage banners and modals', () => {
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
