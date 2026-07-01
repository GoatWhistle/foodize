import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationBell from '../../components/ui/NotificationBell';

const makeStore = (overrides = {}) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  fetchNotifications: vi.fn().mockResolvedValue(undefined),
  loadMore: vi.fn().mockResolvedValue(undefined),
  markAsRead: vi.fn().mockResolvedValue(undefined),
  markAllAsRead: vi.fn().mockResolvedValue(undefined),
  deleteNotification: vi.fn().mockResolvedValue(undefined),
  deleteAll: vi.fn().mockResolvedValue(undefined),
  connectWs: vi.fn(),
  disconnectWs: vi.fn(),
  ...overrides,
});

let storeState = makeStore();

vi.mock('../../store/useNotificationStore', () => ({
  useNotificationStore: vi.fn((sel) => (sel ? sel(storeState) : storeState)),
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel) => {
    const state = { user: { id: 'user-1' }, isAuthenticated: true };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn) => fn,
}));

const { useNotificationStore } = await import('../../store/useNotificationStore');

const render$ = () => render(<NotificationBell />);

beforeEach(() => {
  storeState = makeStore();
  useNotificationStore.mockImplementation((sel) => (sel ? sel(storeState) : storeState));
});

describe('NotificationBell', () => {
  it('renders bell button', () => {
    render$();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows unread badge when unreadCount > 0', () => {
    storeState = makeStore({ unreadCount: 3 });
    useNotificationStore.mockImplementation((sel) => (sel ? sel(storeState) : storeState));
    render$();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows 9+ badge when unreadCount > 9', () => {
    storeState = makeStore({ unreadCount: 15 });
    useNotificationStore.mockImplementation((sel) => (sel ? sel(storeState) : storeState));
    render$();
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('does not show badge when unreadCount is 0', () => {
    render$();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('opens dropdown on bell click', async () => {
    render$();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Уведомления')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    render$();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Нет уведомлений')).toBeInTheDocument();
    });
  });

  it('renders notifications list', async () => {
    storeState = makeStore({
      notifications: [
        { id: '1', title: 'Заказ принят', message: 'Ресторан принял ваш заказ', is_read: false, created_at: new Date().toISOString() },
        { id: '2', title: 'Заказ готов', message: 'Ваш заказ готов', is_read: true, created_at: new Date().toISOString() },
      ],
      unreadCount: 1,
      total: 2,
    });
    useNotificationStore.mockImplementation((sel) => (sel ? sel(storeState) : storeState));
    render$();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Заказ принят')).toBeInTheDocument();
      expect(screen.getByText('Заказ готов')).toBeInTheDocument();
    });
  });

  it('calls markAllAsRead when "Прочитать все" clicked', async () => {
    storeState = makeStore({
      notifications: [{ id: '1', title: 'Test', message: 'msg', is_read: false, created_at: new Date().toISOString() }],
      unreadCount: 1,
      total: 1,
    });
    useNotificationStore.mockImplementation((sel) => (sel ? sel(storeState) : storeState));
    render$();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Прочитать все'));
    fireEvent.click(screen.getByText('Прочитать все'));
    expect(storeState.markAllAsRead).toHaveBeenCalled();
  });

  it('calls deleteAll when trash icon clicked in header', async () => {
    storeState = makeStore({
      notifications: [{ id: '1', title: 'Test', message: 'msg', is_read: true, created_at: new Date().toISOString() }],
      unreadCount: 0,
      total: 1,
    });
    useNotificationStore.mockImplementation((sel) => (sel ? sel(storeState) : storeState));
    render$();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => screen.getByLabelText('Удалить все'));
    fireEvent.click(screen.getByLabelText('Удалить все'));
    expect(storeState.deleteAll).toHaveBeenCalled();
  });

  it('calls markAsRead when unread notification clicked', async () => {
    storeState = makeStore({
      notifications: [{ id: 'notif-1', title: 'Новый заказ', message: 'msg', is_read: false, created_at: new Date().toISOString() }],
      unreadCount: 1,
      total: 1,
    });
    useNotificationStore.mockImplementation((sel) => (sel ? sel(storeState) : storeState));
    render$();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Новый заказ'));
    fireEvent.click(screen.getByText('Новый заказ').closest('div[style]'));
    expect(storeState.markAsRead).toHaveBeenCalledWith('notif-1');
  });
});
