import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { UserDetailModal } from '../../../../../pages/admin/tabs/detailModals/UserDetailModal';
import type { AdminUser } from '@shared/types/models';
import type { AuthUser } from '@shared/store/createAuthStore';

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
    expect(screen.getByText('Активен')).toBeInTheDocument();
  });

  it('renders role preset buttons and make-admin, calls handlers', async () => {
    const props = baseProps();
    render(<UserDetailModal {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Вендор' }));
    expect(props.handleSetPermissionPreset).toHaveBeenCalledWith('u1', 'VENDOR');
    await userEvent.click(screen.getByRole('button', { name: 'Сделать админом' }));
    expect(props.handleMakeAdmin).toHaveBeenCalledWith('u1');
  });

  it('blocks an active non-admin user', async () => {
    const props = baseProps();
    render(<UserDetailModal {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Заблокировать пользователя' }));
    expect(props.handleDeleteUser).toHaveBeenCalledWith('u1');
  });

  it('activates a blocked user', async () => {
    const props = baseProps({ is_active: false });
    render(<UserDetailModal {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Разблокировать' }));
    expect(props.handleActivateUser).toHaveBeenCalledWith('u1');
  });

  it('shows applying label when loading', () => {
    render(<UserDetailModal {...baseProps({ is_active: false })} permissionActionLoading />);
    expect(screen.getByText('Применяю...')).toBeInTheDocument();
  });

  it('hides role management for self', () => {
    render(<UserDetailModal {...baseProps({ id: 'me' })} />);
    expect(screen.queryByText('Управление ролью')).not.toBeInTheDocument();
  });

  it('hides role management for admins', () => {
    render(<UserDetailModal {...baseProps({ permissions: ['admin.access'] })} />);
    expect(screen.queryByText('Управление ролью')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Заблокировать пользователя' })).not.toBeInTheDocument();
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
    expect(screen.getByText('Пользователь')).toBeInTheDocument();
    expect(screen.getByText('Не указан')).toBeInTheDocument();
    expect(screen.getAllByText('Не указано').length).toBeGreaterThan(0);
  });

  it('closes via header button', async () => {
    const props = baseProps();
    render(<UserDetailModal {...props} />);
    await userEvent.click(screen.getByLabelText('Закрыть'));
    expect(props.setSelectedUser).toHaveBeenCalledWith(null);
  });
});
