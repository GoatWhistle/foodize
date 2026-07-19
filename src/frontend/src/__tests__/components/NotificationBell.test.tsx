import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Notification } from '@shared/types/models';
import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
import { mockZustandStore } from '../testUtils';
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
const { useAuthStore } = await import('../../store/useAuthStore');

const render$ = () => render(<NotificationBell />);

const applyStore = () => {
  vi.mocked(useNotificationStore).mockImplementation(
    mockZustandStore(() => storeState) as unknown as typeof useNotificationStore,
  );
};

beforeEach(() => {
  storeState = makeStore();
  applyStore();
  vi.mocked(useAuthStore).mockImplementation(((sel?: (s: { user: { id: string } | null }) => unknown) => {
    const state = { user: { id: 'user-1' } };
    return sel ? sel(state) : state;
  }) as unknown as typeof useAuthStore);
});

describe('NotificationBell', () => {
  it('renders bell button', () => {
    render$();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows unread badge when unreadCount > 0', () => {
    storeState = makeStore({ unreadCount: 3 });
    applyStore();
    render$();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows 9+ badge when unreadCount > 9', () => {
    storeState = makeStore({ unreadCount: 15 });
    applyStore();
    render$();
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('does not show badge when unreadCount is 0', () => {
    render$();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('opens dropdown on bell click', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Уведомления')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
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
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
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
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Прочитать все'));
    await user.click(screen.getByText('Прочитать все'));
    expect(storeState.markAllAsRead).toHaveBeenCalled();
  });

  it('calls deleteAll when trash icon clicked in header', async () => {
    storeState = makeStore({
      notifications: [{ id: '1', title: 'Test', message: 'msg', is_read: true, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 0,
      total: 1,
    });
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByLabelText('Удалить все'));
    await user.click(screen.getByLabelText('Удалить все'));
    expect(storeState.deleteAll).toHaveBeenCalled();
  });

  it('calls markAsRead when unread notification clicked', async () => {
    storeState = makeStore({
      notifications: [{ id: 'notif-1', title: 'Новый заказ', message: 'msg', is_read: false, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 1,
      total: 1,
    });
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Новый заказ'));
    await user.click(screen.getByTestId('notification-item-notif-1'));
    expect(storeState.markAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('does not call markAsRead when a read notification is clicked', async () => {
    storeState = makeStore({
      notifications: [{ id: 'r1', title: 'Прочитано', message: 'msg', is_read: true, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 0,
      total: 1,
    });
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Прочитано'));
    await user.click(screen.getByTestId('notification-item-r1'));
    expect(storeState.markAsRead).not.toHaveBeenCalled();
  });

  it('deletes a single notification without opening it', async () => {
    storeState = makeStore({
      notifications: [{ id: 'd1', title: 'Удаляемое', message: 'msg', is_read: false, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 1,
      total: 1,
    });
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Удаляемое'));
    await user.click(screen.getByLabelText('Удалить'));
    expect(storeState.deleteNotification).toHaveBeenCalledWith('d1');
    expect(storeState.markAsRead).not.toHaveBeenCalled();
  });

  it('loads more notifications when more are available', async () => {
    storeState = makeStore({
      notifications: [{ id: 'n1', title: 'A', message: 'm', is_read: true, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 0,
      total: 5,
    });
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Загрузить ещё'));
    await user.click(screen.getByText('Загрузить ещё'));
    expect(storeState.loadMore).toHaveBeenCalled();
  });

  it('does not render the load more button when all are loaded', async () => {
    storeState = makeStore({
      notifications: [{ id: 'n1', title: 'A', message: 'm', is_read: true, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 0,
      total: 1,
    });
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('A'));
    expect(screen.queryByText('Загрузить ещё')).toBeNull();
  });

  it('groups notifications by day label', async () => {
    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();
    storeState = makeStore({
      notifications: [
        { id: 't', title: 'Сегодня-N', message: 'm', is_read: true, created_at: new Date(now).toISOString() },
        { id: 'y', title: 'Вчера-N', message: 'm', is_read: true, created_at: new Date(now - day).toISOString() },
        { id: 'f', title: 'Давно-N', message: 'm', is_read: true, created_at: new Date(now - 6 * day).toISOString() },
      ] as unknown as Notification[],
      unreadCount: 0,
      total: 3,
    });
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Сегодня'));
    expect(screen.getByText('Сегодня')).toBeInTheDocument();
    expect(screen.getByText('Вчера')).toBeInTheDocument();
    expect(screen.getByText('6 дней назад')).toBeInTheDocument();
  });

  it('labels notifications with a missing or invalid date as recent', async () => {
    storeState = makeStore({
      notifications: [
        { id: 'inv', title: 'Без даты', message: 'm', is_read: true, created_at: 'not-a-date' },
      ] as unknown as Notification[],
      unreadCount: 0,
      total: 1,
    });
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Без даты'));
    expect(screen.getByText('Недавно')).toBeInTheDocument();
  });

  it('closes the dropdown on an outside click', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Уведомления'));
    await user.click(document.body);
    await waitFor(() => {
      expect(screen.queryByText('Уведомления')).toBeNull();
    });
  });

  it('renders nothing when the user is not authenticated', () => {
    vi.mocked(useAuthStore).mockImplementation(((sel?: (s: { user: null }) => unknown) => {
      const state = { user: null };
      return sel ? sel(state) : state;
    }) as unknown as typeof useAuthStore);
    const { container } = render$();
    expect(container).toBeEmptyDOMElement();
  });
});
