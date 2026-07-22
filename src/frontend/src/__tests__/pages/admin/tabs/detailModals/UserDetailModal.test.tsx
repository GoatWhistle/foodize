import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { UserDetailModal } from '../../../../../pages/admin/tabs/detailModals/UserDetailModal';
import type { AdminUser } from '@shared/types/models';
import type { AuthUser } from '@shared/store/createAuthStore';
import { t } from '@shared/i18n/useTranslation';

const makeUser = (over: Partial<AdminUser> = {}): AdminUser =>
  ({
    id: 'u1',
    name: 'Иван',
    first_name: 'Иван',
    last_name: 'Петров',
    phone_number: '+79990001122',
    telegram_username: 'ivan',
    email: 'ivan@mail.ru',
    created_at: '2026-01-01T00:00:00Z',
    permissions: ['orders.read_own'],
    is_active: true,
    ...over,
  }) as unknown as AdminUser;

const currentUser = { id: 'me' } as unknown as AuthUser;

const baseProps = (over: Partial<AdminUser> = {}) => ({
  selectedUser: makeUser(over),
  setSelectedUser: vi.fn(),
  userDetailsLoading: false,
  currentUser,
  permissionActionLoading: false,
  handleSetPermissionPreset: vi.fn(),
  handleMakeAdmin: vi.fn(),
  handleActivateUser: vi.fn(),
  handleDeleteUser: vi.fn(),
});

describe('UserDetailModal', () => {
  it('renders profile fields including telegram and email', () => {
    render(<UserDetailModal {...baseProps()} />);
    expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    expect(screen.getByText('@ivan')).toBeInTheDocument();
    expect(screen.getByText('ivan@mail.ru')).toBeInTheDocument();
    expect(screen.getByText(t('admin.users.card.active'))).toBeInTheDocument();
  });

  it('renders role preset buttons and make-admin, calls handlers', async () => {
    const props = baseProps();
    render(<UserDetailModal {...props} />);
    await userEvent.click(screen.getByRole('button', { name: t('enums.permissionPreset.VENDOR') }));
    expect(props.handleSetPermissionPreset).toHaveBeenCalledWith('u1', 'VENDOR');
    await userEvent.click(screen.getByRole('button', { name: t('admin.users.modal.makeAdmin') }));
    expect(props.handleMakeAdmin).toHaveBeenCalledWith('u1');
  });

  it('blocks an active non-admin user', async () => {
    const props = baseProps();
    render(<UserDetailModal {...props} />);
    await userEvent.click(screen.getByRole('button', { name: t('admin.users.modal.block') }));
    expect(props.handleDeleteUser).toHaveBeenCalledWith('u1');
  });

  it('activates a blocked user', async () => {
    const props = baseProps({ is_active: false });
    render(<UserDetailModal {...props} />);
    await userEvent.click(screen.getByRole('button', { name: t('admin.users.modal.unblock') }));
    expect(props.handleActivateUser).toHaveBeenCalledWith('u1');
  });

  it('shows applying label when loading', () => {
    render(<UserDetailModal {...baseProps({ is_active: false })} permissionActionLoading />);
    expect(screen.getByText(t('common.actions.applying'))).toBeInTheDocument();
  });

  it('hides role management for self', () => {
    render(<UserDetailModal {...baseProps({ id: 'me' })} />);
    expect(screen.queryByText(t('admin.users.modal.roleManagement'))).not.toBeInTheDocument();
  });

  it('hides role management for admins', () => {
    render(<UserDetailModal {...baseProps({ permissions: ['admin.access'] })} />);
    expect(screen.queryByText(t('admin.users.modal.roleManagement'))).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t('admin.users.modal.block') })).not.toBeInTheDocument();
  });

  it('uses fallbacks for missing fields', () => {
    render(
      <UserDetailModal
        {...baseProps({
          name: '',
          first_name: '',
          last_name: '',
          phone_number: '',
          telegram_username: '',
          email: '',
        })}
      />,
    );
    expect(
      screen.getByText(t('admin.users.modal.fallbackTitle')),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(t('common.states.notSpecifiedMale')).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(t('common.states.notSpecified')).length).toBeGreaterThan(0);
  });

  it('closes via header button', async () => {
    const props = baseProps();
    render(<UserDetailModal {...props} />);
    await userEvent.click(screen.getByLabelText(t('common.actions.close')));
    expect(props.setSelectedUser).toHaveBeenCalledWith(null);
  });
});
