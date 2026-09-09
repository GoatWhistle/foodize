import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AccountMenu } from '../../components/layout/AccountMenu';
import { vendorService } from '@shared/services/vendorService';
import { staffService } from '@shared/services/staffService';
import { useAuthStore } from '../../store/useAuthStore';
import { t } from '@shared/i18n/useTranslation';

type AuthState = { user: { id: string; permissions: string[] } | null };

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@shared/services/vendorService', () => ({
  vendorService: {
    getMyProfile: vi.fn(),
    createProfile: vi.fn(),
  },
}));

vi.mock('@shared/services/staffService', () => ({
  staffService: {
    getMyProfile: vi.fn(),
  },
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel?: (s: AuthState) => unknown) => {
    const state: AuthState = { user: { id: 'user-1', permissions: [] } };
    return sel ? sel(state) : state;
  }),
}));

const setUser = (permissions: string[]) => {
  vi.mocked(useAuthStore).mockImplementation(((sel?: (s: AuthState) => unknown) => {
    const state: AuthState = { user: { id: 'user-1', permissions } };
    return sel ? sel(state) : state;
  }) as typeof useAuthStore);
};

const renderMenu = () =>
  render(
    <BrowserRouter>
      <AccountMenu />
    </BrowserRouter>
  );

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByLabelText(t('profile.nav.account')));
};

describe('AccountMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUser([]);
    vi.mocked(vendorService.getMyProfile).mockRejectedValue(new Error('none'));
    vi.mocked(staffService.getMyProfile).mockRejectedValue(new Error('none'));
  });

  it('opens dropdown with profile and orders items', async () => {
    const user = userEvent.setup();
    renderMenu();
    expect(screen.queryByRole('menu')).toBeNull();
    await openMenu(user);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText(t('profile.nav.profile'))).toBeInTheDocument();
    expect(screen.getByText(t('profile.page.myOrders'))).toBeInTheDocument();
  });

  it('navigates to orders and closes', async () => {
    const user = userEvent.setup();
    renderMenu();
    await openMenu(user);
    await user.click(screen.getByText(t('profile.page.myOrders')));
    expect(mockNavigate).toHaveBeenCalledWith('/orders');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('shows become vendor for plain user and calls createProfile', async () => {
    vi.mocked(vendorService.createProfile).mockResolvedValue({
      data: { data: { approval_status: 'PENDING' } },
    } as never);
    const user = userEvent.setup();
    renderMenu();
    await openMenu(user);
    const becomeVendor = await screen.findByText(t('profile.roles.becomeVendor'));
    await user.click(becomeVendor);
    await waitFor(() => {
      expect(vendorService.createProfile).toHaveBeenCalled();
    });
    expect(await screen.findByText(t('profile.roles.vendorPending'))).toBeInTheDocument();
  });

  it('shows vendor dashboard when approved', async () => {
    vi.mocked(vendorService.getMyProfile).mockResolvedValue({
      data: { data: { approval_status: 'APPROVED' } },
    } as never);
    const user = userEvent.setup();
    renderMenu();
    await openMenu(user);
    const dashboard = await screen.findByText(t('profile.roles.vendorDashboard'));
    await user.click(dashboard);
    expect(mockNavigate).toHaveBeenCalledWith('/vendor');
    expect(screen.queryByText(t('profile.roles.becomeVendor'))).toBeNull();
  });

  it('shows pending state for unapproved vendor', async () => {
    vi.mocked(vendorService.getMyProfile).mockResolvedValue({
      data: { data: { approval_status: 'PENDING' } },
    } as never);
    const user = userEvent.setup();
    renderMenu();
    await openMenu(user);
    expect(await screen.findByText(t('profile.roles.vendorPending'))).toBeInTheDocument();
  });

  it('shows staff and admin items by role', async () => {
    setUser(['admin.access']);
    vi.mocked(staffService.getMyProfile).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderMenu();
    await openMenu(user);
    expect(await screen.findByText(t('profile.roles.staffDashboard'))).toBeInTheDocument();
    expect(screen.getByText(t('profile.page.adminPanelShort'))).toBeInTheDocument();
    expect(screen.queryByText(t('profile.roles.becomeVendor'))).toBeNull();
  });

  it('navigates to profile', async () => {
    const user = userEvent.setup();
    renderMenu();
    await openMenu(user);
    await user.click(screen.getByText(t('profile.nav.profile')));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  it('navigates to the staff dashboard', async () => {
    vi.mocked(staffService.getMyProfile).mockResolvedValue({} as never);
    const user = userEvent.setup();
    renderMenu();
    await openMenu(user);
    await user.click(await screen.findByText(t('profile.roles.staffDashboard')));
    expect(mockNavigate).toHaveBeenCalledWith('/staff');
  });

  it('navigates to the admin panel', async () => {
    setUser(['admin.access']);
    const user = userEvent.setup();
    renderMenu();
    await openMenu(user);
    await user.click(await screen.findByText(t('profile.page.adminPanelShort')));
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('closes on escape', async () => {
    const user = userEvent.setup();
    renderMenu();
    await openMenu(user);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
