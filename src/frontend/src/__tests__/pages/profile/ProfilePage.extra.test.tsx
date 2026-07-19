import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from '../../../pages/profile/ProfilePage';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { vendorService } from '@shared/services/vendorService';
import { staffService } from '@shared/services/staffService';
import { hasPermission } from '@shared/utils/permissions';

type AuthState = { user: { name: string; phone_number: string } | null };
type NotifState = { unreadCount: number };

const authState: AuthState = { user: { name: 'Ivan Ivanov', phone_number: '+7999' } };
const notifState: NotifState = { unreadCount: 3 };

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel?: (s: AuthState) => unknown) => (sel ? sel(authState) : authState)),
}));

vi.mock('../../../store/useNotificationStore', () => ({
  useNotificationStore: vi.fn((sel?: (s: NotifState) => unknown) =>
    sel ? sel(notifState) : notifState,
  ),
}));

vi.mock('@shared/services/vendorService', () => ({
  vendorService: { getMyProfile: vi.fn(), createProfile: vi.fn() },
}));

vi.mock('@shared/services/staffService', () => ({
  staffService: { getMyProfile: vi.fn() },
}));

vi.mock('@shared/utils/permissions', async () => {
  const actual = await vi.importActual<typeof import('@shared/utils/permissions')>(
    '@shared/utils/permissions',
  );
  return { ...actual, hasPermission: vi.fn(() => false) };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );

const approvedVendor = {
  data: { data: { approval_status: 'APPROVED' } },
} as unknown as Awaited<ReturnType<typeof vendorService.getMyProfile>>;

const pendingVendor = {
  data: { data: { approval_status: 'PENDING' } },
} as unknown as Awaited<ReturnType<typeof vendorService.getMyProfile>>;

describe('ProfilePage extra branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hasPermission).mockReturnValue(false);
    vi.mocked(staffService.getMyProfile).mockRejectedValue(new Error('no'));
    vi.mocked(vendorService.getMyProfile).mockRejectedValue(new Error('no'));
    vi.mocked(useNotificationStore).mockImplementation(((sel?: (s: NotifState) => unknown) =>
      sel ? sel(notifState) : notifState) as typeof useNotificationStore);
    vi.mocked(useAuthStore).mockImplementation(((sel?: (s: AuthState) => unknown) =>
      sel ? sel(authState) : authState) as typeof useAuthStore);
  });

  it('shows approved vendor dashboard link and navigates', async () => {
    vi.mocked(vendorService.getMyProfile).mockResolvedValueOnce(approvedVendor);
    renderPage();
    const item = await screen.findByText('Кабинет вендора');
    const user = userEvent.setup();
    await user.click(item);
    expect(mockNavigate).toHaveBeenCalledWith('/vendor');
  });

  it('shows pending approval note without navigation for unapproved vendor', async () => {
    vi.mocked(vendorService.getMyProfile).mockResolvedValueOnce(pendingVendor);
    renderPage();
    expect(await screen.findByText('Ожидание одобрения администратором')).toBeInTheDocument();
  });

  it('shows admin vendor dashboard link for admins even without vendor profile', async () => {
    vi.mocked(hasPermission).mockReturnValue(true);
    renderPage();
    const item = await screen.findByText('Кабинет вендора');
    const user = userEvent.setup();
    await user.click(item);
    expect(mockNavigate).toHaveBeenCalledWith('/vendor');
  });

  it('lets a non-vendor become a vendor', async () => {
    vi.mocked(vendorService.createProfile).mockResolvedValueOnce(approvedVendor);
    renderPage();
    const become = await screen.findByText('Стать вендором');
    const user = userEvent.setup();
    await user.click(become);
    await waitFor(() => {
      expect(vendorService.createProfile).toHaveBeenCalledWith({});
    });
    expect(await screen.findByText('Кабинет вендора')).toBeInTheDocument();
  });

  it('shows error when becoming a vendor fails', async () => {
    vi.mocked(vendorService.createProfile).mockRejectedValueOnce({ response: { status: 500 } });
    renderPage();
    const become = await screen.findByText('Стать вендором');
    const user = userEvent.setup();
    await user.click(become);
    expect(await screen.findByText('Не удалось стать вендором')).toBeInTheDocument();
  });

  it('shows unread notification badge from the notification store', async () => {
    renderPage();
    await waitFor(() => {
      expect(vendorService.getMyProfile).toHaveBeenCalled();
    });
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
