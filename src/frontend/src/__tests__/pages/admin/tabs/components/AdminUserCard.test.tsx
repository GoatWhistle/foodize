import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { AdminUserCard } from '../../../../../pages/admin/tabs/components/AdminUserCard';
import type { AdminUser } from '../../../../../pages/admin/hooks/useAdminUsers';
import type { AuthUser } from '@shared/store/createAuthStore';

const makeUser = (over: Partial<AdminUser> = {}): AdminUser =>
  ({
    id: 'u1',
    name: 'Иван',
    phone_number: '+79990001122',
    permissions: ['orders.read_own'],
    is_active: true,
    ...over,
  }) as unknown as AdminUser;

const currentUser = { id: 'me' } as unknown as AuthUser;

describe('AdminUserCard', () => {
  it('renders name, phone and active badge', () => {
    render(
      <AdminUserCard
        user={makeUser()}
        selected={false}
        currentUser={currentUser}
        onToggleSelect={vi.fn()}
        onOpen={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Иван')).toBeInTheDocument();
    expect(screen.getByText('+79990001122')).toBeInTheDocument();
    expect(screen.getByText('Активен')).toBeInTheDocument();
  });

  it('shows fallbacks and blocked badge', () => {
    render(
      <AdminUserCard
        user={makeUser({ name: '', phone_number: '', is_active: false })}
        selected={false}
        currentUser={currentUser}
        onToggleSelect={vi.fn()}
        onOpen={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Без имени')).toBeInTheDocument();
    expect(screen.getByText('Нет телефона')).toBeInTheDocument();
    expect(screen.getByText('Заблокирован')).toBeInTheDocument();
  });

  it('opens on click and on keyboard Enter/Space', async () => {
    const onOpen = vi.fn();
    render(
      <AdminUserCard
        user={makeUser()}
        selected={false}
        currentUser={currentUser}
        onToggleSelect={vi.fn()}
        onOpen={onOpen}
        onDelete={vi.fn()}
      />,
    );
    const card = screen.getByRole('button', { name: /Иван/ });
    await userEvent.click(card);
    card.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onOpen).toHaveBeenCalledTimes(3);
    expect(onOpen).toHaveBeenCalledWith('u1');
  });

  it('toggles selection via checkbox', async () => {
    const onToggleSelect = vi.fn();
    render(
      <AdminUserCard
        user={makeUser()}
        selected={false}
        currentUser={currentUser}
        onToggleSelect={onToggleSelect}
        onOpen={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggleSelect).toHaveBeenCalledWith('u1', true);
  });

  it('shows delete for non-admin, non-self and calls onDelete', async () => {
    const onDelete = vi.fn();
    render(
      <AdminUserCard
        user={makeUser()}
        selected={false}
        currentUser={currentUser}
        onToggleSelect={vi.fn()}
        onOpen={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await userEvent.click(screen.getByTitle('Заблокировать'));
    expect(onDelete).toHaveBeenCalledWith('u1');
  });

  it('hides delete for self', () => {
    render(
      <AdminUserCard
        user={makeUser({ id: 'me' })}
        selected={false}
        currentUser={currentUser}
        onToggleSelect={vi.fn()}
        onOpen={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByTitle('Заблокировать')).not.toBeInTheDocument();
  });

  it('hides delete for admin users', () => {
    render(
      <AdminUserCard
        user={makeUser({ permissions: ['admin.access'] })}
        selected={false}
        currentUser={currentUser}
        onToggleSelect={vi.fn()}
        onOpen={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByTitle('Заблокировать')).not.toBeInTheDocument();
  });
});
