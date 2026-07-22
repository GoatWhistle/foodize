import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { t } from '@shared/i18n/useTranslation';
import { ProfilePage } from '../../pages/profile/ProfilePage';
import { useAuthStore } from '../../store/useAuthStore';
import { useModalStore } from '@shared/store/useModalStore';
import { staffService } from '@shared/services/staffService.js';
import { vendorService } from '@shared/services/vendorService.js';

type AuthState = {
  user: { name: string; phone_number: string };
  logout: () => void;
};

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel?: (s: AuthState) => unknown) => {
    const state: AuthState = {
      user: { name: 'Ivan Ivanov', phone_number: '+7999' },
      logout: vi.fn(),
    };
    return sel ? sel(state) : state;
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@shared/services/vendorService.js', () => ({
  vendorService: {
    getMyProfile: vi.fn().mockRejectedValue(new Error('Not a vendor')),
    createProfile: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@shared/services/staffService.js', () => ({
  staffService: {
    getMyProfile: vi.fn().mockRejectedValue(new Error('Not a staff member')),
  },
}));

vi.mock('@shared/services/userService.js', () => ({
  userService: {
    updateMe: vi.fn().mockResolvedValue({}),
    changePassword: vi.fn().mockResolvedValue({}),
  },
}));

describe('ProfilePage', () => {
  const logoutMock = vi.fn();

  const waitForProfileChecks = async () => {
    await waitFor(() => {
      expect(vendorService.getMyProfile).toHaveBeenCalled();
      expect(staffService.getMyProfile).toHaveBeenCalled();
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useModalStore.setState({ confirmDialog: null, confirmLoading: false });
    vi.mocked(staffService.getMyProfile).mockRejectedValue(
      new Error('Not a staff member')
    );
    vi.mocked(useAuthStore).mockImplementation(((sel?: (s: AuthState) => unknown) => {
      const state: AuthState = {
        user: { name: 'Ivan Ivanov', phone_number: '+7999' },
        logout: logoutMock,
      };
      return sel ? sel(state) : state;
    }) as typeof useAuthStore);
  });

  it('renders user info and settings action', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    await waitForProfileChecks();

    expect(screen.getByText('Ivan Ivanov')).toBeInTheDocument();
    expect(screen.getByText('+7999')).toBeInTheDocument();
    expect(screen.getByText(t('profile.page.settings'))).toBeInTheDocument();
  });

  it('asks for confirmation before logging out', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    const user = userEvent.setup();
    await waitFor(() => { expect(screen.getByText(t('profile.page.logout'))).toBeInTheDocument(); });
    await user.click(screen.getByText(t('profile.page.logout')));

    expect(logoutMock).not.toHaveBeenCalled();
    expect(useModalStore.getState().confirmDialog?.title).toBe(t('profile.page.logoutTitle'));
  });

  it('calls logout and navigates once confirmed', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    const user = userEvent.setup();
    await waitFor(() => { expect(screen.getByText(t('profile.page.logout'))).toBeInTheDocument(); });
    await user.click(screen.getByText(t('profile.page.logout')));

    await act(async () => { await useModalStore.getState().runConfirmAction(); });

    expect(logoutMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('navigates to orders from menu', async () => {
    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    const user = userEvent.setup();
    await waitForProfileChecks();

    await user.click(screen.getByText(t('profile.page.myOrders')));
    expect(mockNavigate).toHaveBeenCalledWith('/orders');
  });

  it('shows staff dashboard link for staff users', async () => {
    vi.mocked(staffService.getMyProfile).mockResolvedValueOnce({
      data: { data: { id: 'staff-1', restaurant_id: 'rest-1', role: 'COOK' } },
    } as unknown as Awaited<ReturnType<typeof staffService.getMyProfile>>);

    render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );

    const user = userEvent.setup();
    expect(await screen.findByText(t('profile.roles.staffDashboard'))).toBeInTheDocument();

    await user.click(screen.getByText(t('profile.roles.staffDashboard')));
    expect(mockNavigate).toHaveBeenCalledWith('/staff');
  });
});
