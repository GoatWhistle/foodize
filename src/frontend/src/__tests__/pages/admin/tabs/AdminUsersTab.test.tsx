import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AdminUsersTab } from '../../../../pages/admin/tabs/AdminUsersTab';
import type { AdminUser } from '../../../../pages/admin/hooks/useAdminUsers';
import type { AuthUser } from '@shared/store/createAuthStore';
import type { adminService as adminServiceType } from '../../../../services/adminService';
import { at } from '../../../testUtils';

const exportUsersCSV = vi.fn().mockResolvedValue(new Blob());
const adminService = { exportUsersCSV } as unknown as typeof adminServiceType;

const users: AdminUser[] = [
  { id: 'u1', name: 'Alice', phone_number: '+700000001', permissions: [], is_active: true } as unknown as AdminUser,
  { id: 'u2', name: '', phone_number: '', permissions: ['admin.access'], is_active: false } as unknown as AdminUser,
];

const currentUser = { id: 'me', name: 'Me' } as unknown as AuthUser;

interface Overrides {
  users?: AdminUser[];
  usersLoading?: boolean;
  usersTotal?: number;
  selectedUserIds?: Set<string>;
  currentUser?: AuthUser | null;
}

const setUsersPage = vi.fn();
const setUserSearchRaw = vi.fn();
const setUserFilters = vi.fn();
const setSelectedUserIds = vi.fn();
const handleExport = vi.fn();
const loadUserDetails = vi.fn();
const handleDeleteUser = vi.fn();

const renderTab = (o: Overrides = {}) =>
  render(
    <MemoryRouter>
      <AdminUsersTab
        users={o.users ?? users}
        usersLoading={o.usersLoading ?? false}
        usersTotal={o.usersTotal ?? 2}
        usersPage={1}
        setUsersPage={setUsersPage}
        userSearchRaw=""
        setUserSearchRaw={setUserSearchRaw}
        userFilters={{ role: '' }}
        setUserFilters={setUserFilters}
        selectedUserIds={o.selectedUserIds ?? new Set()}
        setSelectedUserIds={setSelectedUserIds}
        exportLoading={false}
        handleExport={handleExport}
        loadUserDetails={loadUserDetails}
        handleDeleteUser={handleDeleteUser}
        currentUser={o.currentUser ?? currentUser}
        todayStr="2026-07-18"
        adminService={adminService}
        PAGE_SIZE={20}
      />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminUsersTab', () => {
  it('renders users with fallbacks and role labels', () => {
    renderTab();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('+700000001')).toBeInTheDocument();
    expect(screen.getByText('Без имени')).toBeInTheDocument();
    expect(screen.getByText('Нет телефона')).toBeInTheDocument();
    expect(screen.getByText('Активен')).toBeInTheDocument();
    expect(screen.getByText('Заблокирован')).toBeInTheDocument();
    expect(screen.getAllByText('Администратор').length).toBeGreaterThan(0);
  });

  it('renders role options excluding CUSTOMER', () => {
    renderTab();
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Клиент' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Администратор' })).toBeInTheDocument();
  });

  it('shows skeleton when loading and empty', () => {
    renderTab({ users: [], usersLoading: true });
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.queryByText('Пользователей пока нет')).not.toBeInTheDocument();
  });

  it('shows empty state when no users', () => {
    renderTab({ users: [], usersTotal: 0 });
    expect(screen.getByText('Пользователей пока нет')).toBeInTheDocument();
  });

  it('updates search and resets page', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.type(screen.getByPlaceholderText('Поиск по имени или телефону'), 'x');
    expect(setUsersPage).toHaveBeenCalledWith(1);
    expect(setUserSearchRaw).toHaveBeenCalled();
  });

  it('updates role filter and resets page', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.selectOptions(screen.getByRole('combobox'), 'ADMIN');
    expect(setUsersPage).toHaveBeenCalledWith(1);
    expect(setUserFilters).toHaveBeenCalledWith(expect.any(Function));
    const updater = setUserFilters.mock.calls[0]?.[0] as (p: { role: string }) => { role: string };
    expect(updater({ role: 'x' })).toHaveProperty('role');
  });

  it('selects all users when none selected', async () => {
    const user = userEvent.setup();
    renderTab();
    const selectAll = screen.getAllByRole('checkbox')[0];
    if (!selectAll) throw new Error('no checkbox');
    await user.click(selectAll);
    expect(setSelectedUserIds).toHaveBeenCalledWith(new Set(['u1', 'u2']));
  });

  it('clears selection when all are selected', async () => {
    const user = userEvent.setup();
    renderTab({ selectedUserIds: new Set(['u1', 'u2']) });
    const allChecked = screen.getAllByRole('checkbox')[0] as HTMLInputElement;
    expect(allChecked.checked).toBe(true);
    await user.click(allChecked);
    expect(setSelectedUserIds).toHaveBeenCalledWith(new Set());
  });

  it('runs the add branch when an unselected user checkbox is toggled', async () => {
    const user = userEvent.setup();
    renderTab();
    const rowCheckbox = screen.getAllByRole('checkbox')[1] as HTMLInputElement;
    expect(rowCheckbox.checked).toBe(false);
    await user.click(rowCheckbox);
    const updater = setSelectedUserIds.mock.calls.at(-1)?.[0] as (p: Set<string>) => Set<string>;
    expect(updater(new Set())).toEqual(new Set(['u1']));
  });

  it('runs the delete branch when a selected user checkbox is toggled', async () => {
    const user = userEvent.setup();
    renderTab({ selectedUserIds: new Set(['u1']) });
    const rowCheckbox = screen.getAllByRole('checkbox')[1] as HTMLInputElement;
    expect(rowCheckbox.checked).toBe(true);
    await user.click(rowCheckbox);
    const updater = setSelectedUserIds.mock.calls.at(-1)?.[0] as (p: Set<string>) => Set<string>;
    expect(updater(new Set(['u1']))).toEqual(new Set());
  });

  it('opens user details on card click', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getByText('Alice'));
    expect(loadUserDetails).toHaveBeenCalledWith('u1');
  });

  it('shows delete button for regular users and hides it for admins', async () => {
    const user = userEvent.setup();
    renderTab();
    const deleteButtons = screen.getAllByTitle('Заблокировать');
    expect(deleteButtons).toHaveLength(1);
    await user.click(at(deleteButtons, 0));
    expect(handleDeleteUser).toHaveBeenCalledWith('u1');
  });

  it('hides delete button for the current user', () => {
    renderTab({
      users: [
        { id: 'me', name: 'Me', phone_number: '', permissions: [], is_active: true } as unknown as AdminUser,
      ],
    });
    expect(screen.queryByTitle('Заблокировать')).not.toBeInTheDocument();
  });

  it('triggers CSV export', async () => {
    const user = userEvent.setup();
    renderTab();
    await user.click(screen.getByRole('button', { name: /CSV/i }));
    expect(handleExport).toHaveBeenCalledWith(exportUsersCSV, 'пользователи_2026-07-18.csv');
  });

  it('dims the list while reloading with data present', () => {
    const { container } = render(
      <MemoryRouter>
        <AdminUsersTab
          users={users}
          usersLoading={true}
          usersTotal={2}
          usersPage={1}
          setUsersPage={setUsersPage}
          userSearchRaw=""
          setUserSearchRaw={setUserSearchRaw}
          userFilters={{ role: '' }}
          setUserFilters={setUserFilters}
          selectedUserIds={new Set()}
          setSelectedUserIds={setSelectedUserIds}
          exportLoading={true}
          handleExport={handleExport}
          loadUserDetails={loadUserDetails}
          handleDeleteUser={handleDeleteUser}
          currentUser={currentUser}
          todayStr="2026-07-18"
          adminService={adminService}
          PAGE_SIZE={20}
        />
      </MemoryRouter>
    );
    expect(container.querySelector('.loading-dim')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '...' })).toBeDisabled();
  });

  it('paginates when multiple pages', async () => {
    const user = userEvent.setup();
    renderTab({ usersTotal: 60 });
    await user.click(screen.getByRole('button', { name: 'Перейти на страницу 2' }));
    expect(setUsersPage).toHaveBeenCalledWith(2);
  });
});
