import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Notification } from '@shared/types/models';
import NotificationBell from '../../components/NotificationBell/NotificationBell';

type NotificationStoreState = {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  fetchNotifications: ReturnType<typeof vi.fn>;
  loadMore: ReturnType<typeof vi.fn>;
  markAsRead: ReturnType<typeof vi.fn>;
  markAllAsRead: ReturnType<typeof vi.fn>;
  deleteNotification: ReturnType<typeof vi.fn>;
  deleteAll: ReturnType<typeof vi.fn>;
  connectWs: ReturnType<typeof vi.fn>;
  disconnectWs: ReturnType<typeof vi.fn>;
};

const makeStore = (overrides: Partial<NotificationStoreState> = {}): NotificationStoreState => ({
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
  useNotificationStore: vi.fn((sel?: (s: NotificationStoreState) => unknown) =>
    sel ? sel(storeState) : storeState
  ),
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: vi.fn((sel?: (s: { user: { id: string } | null }) => unknown) => {
    const state = { user: { id: 'user-1' } };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: <T,>(fn: T) => fn,
}));

const { useNotificationStore } = await import('../../store/useNotificationStore');

const render$ = () => render(<NotificationBell />);

beforeEach(() => {
  storeState = makeStore();
  vi.mocked(useNotificationStore).mockImplementation(((sel?: (s: NotificationStoreState) => unknown) =>
    sel ? sel(storeState) : storeState) as typeof useNotificationStore);
});

describe('NotificationBell', () => {
  it('renders bell button', () => {
    render$();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows unread badge when unreadCount > 0', () => {
    storeState = makeStore({ unreadCount: 3 });
    vi.mocked(useNotificationStore).mockImplementation(((sel?: (s: NotificationStoreState) => unknown) => (sel ? sel(storeState) : storeState)) as typeof useNotificationStore);
    render$();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows 9+ badge when unreadCount > 9', () => {
    storeState = makeStore({ unreadCount: 15 });
    vi.mocked(useNotificationStore).mockImplementation(((sel?: (s: NotificationStoreState) => unknown) => (sel ? sel(storeState) : storeState)) as typeof useNotificationStore);
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
      ] as unknown as Notification[],
      unreadCount: 1,
      total: 2,
    });
    vi.mocked(useNotificationStore).mockImplementation(((sel?: (s: NotificationStoreState) => unknown) => (sel ? sel(storeState) : storeState)) as typeof useNotificationStore);
    render$();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Заказ принят')).toBeInTheDocument();
      expect(screen.getByText('Заказ готов')).toBeInTheDocument();
    });
  });

  it('calls markAllAsRead when "Прочитать все" clicked', async () => {
    storeState = makeStore({
      notifications: [{ id: '1', title: 'Test', message: 'msg', is_read: false, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 1,
      total: 1,
    });
    vi.mocked(useNotificationStore).mockImplementation(((sel?: (s: NotificationStoreState) => unknown) => (sel ? sel(storeState) : storeState)) as typeof useNotificationStore);
    render$();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Прочитать все'));
    fireEvent.click(screen.getByText('Прочитать все'));
    expect(storeState.markAllAsRead).toHaveBeenCalled();
  });

  it('calls deleteAll when trash icon clicked in header', async () => {
    storeState = makeStore({
      notifications: [{ id: '1', title: 'Test', message: 'msg', is_read: true, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 0,
      total: 1,
    });
    vi.mocked(useNotificationStore).mockImplementation(((sel?: (s: NotificationStoreState) => unknown) => (sel ? sel(storeState) : storeState)) as typeof useNotificationStore);
    render$();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => screen.getByLabelText('Удалить все'));
    fireEvent.click(screen.getByLabelText('Удалить все'));
    expect(storeState.deleteAll).toHaveBeenCalled();
  });

  it('calls markAsRead when unread notification clicked', async () => {
    storeState = makeStore({
      notifications: [{ id: 'notif-1', title: 'Новый заказ', message: 'msg', is_read: false, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 1,
      total: 1,
    });
    vi.mocked(useNotificationStore).mockImplementation(((sel?: (s: NotificationStoreState) => unknown) => (sel ? sel(storeState) : storeState)) as typeof useNotificationStore);
    render$();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Новый заказ'));
    fireEvent.click(screen.getByText('Новый заказ').closest('div[style]') as HTMLElement);
    expect(storeState.markAsRead).toHaveBeenCalledWith('notif-1');
  });
});
