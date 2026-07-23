import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Notification } from '@shared/types/models';
import { NotificationBell } from '../../components/NotificationBell/NotificationBell';
import { mockZustandStore } from '../testUtils';
import { t } from '@shared/i18n/useTranslation';
import { bellStore, makeStore } from './notificationBellTestUtils';

vi.mock('../../store/useNotificationStore', async () => {
  const { bellStore } = await import('./notificationBellTestUtils');
  return {
    useNotificationStore: vi.fn((sel?: (s: typeof bellStore.state) => unknown) =>
      sel ? sel(bellStore.state) : bellStore.state
    ),
  };
});

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
    mockZustandStore(() => bellStore.state) as unknown as typeof useNotificationStore,
  );
};

beforeEach(() => {
  bellStore.state = makeStore();
  applyStore();
  vi.mocked(useAuthStore).mockImplementation(((sel?: (s: { user: { id: string } | null }) => unknown) => {
    const state = { user: { id: 'user-1' } };
    return sel ? sel(state) : state;
  }) as unknown as typeof useAuthStore);
});

describe('NotificationBell actions', () => {
  it('calls markAllAsRead when "Прочитать все" clicked', async () => {
    bellStore.state = makeStore({
      notifications: [{ id: '1', title: 'Test', message: 'msg', is_read: false, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 1,
      total: 1,
    });
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText(t('profile.notifications.markAllRead')));
    await user.click(screen.getByText(t('profile.notifications.markAllRead')));
    expect(bellStore.state.markAllAsRead).toHaveBeenCalled();
  });

  it('calls deleteAll when trash icon clicked in header', async () => {
    bellStore.state = makeStore({
      notifications: [{ id: '1', title: 'Test', message: 'msg', is_read: true, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 0,
      total: 1,
    });
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByLabelText(t('profile.notifications.deleteAll')));
    await user.click(screen.getByLabelText(t('profile.notifications.deleteAll')));
    expect(bellStore.state.deleteAll).toHaveBeenCalled();
  });

  it('calls markAsRead when unread notification clicked', async () => {
    bellStore.state = makeStore({
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
    expect(bellStore.state.markAsRead).toHaveBeenCalledWith('notif-1');
  });

  it('does not call markAsRead when a read notification is clicked', async () => {
    bellStore.state = makeStore({
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
    expect(bellStore.state.markAsRead).not.toHaveBeenCalled();
  });

  it('deletes a single notification without opening it', async () => {
    bellStore.state = makeStore({
      notifications: [{ id: 'd1', title: 'Удаляемое', message: 'msg', is_read: false, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 1,
      total: 1,
    });
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Удаляемое'));
    await user.click(screen.getByLabelText(t('profile.notifications.delete')));
    expect(bellStore.state.deleteNotification).toHaveBeenCalledWith('d1');
    expect(bellStore.state.markAsRead).not.toHaveBeenCalled();
  });

  it('loads more notifications when more are available', async () => {
    bellStore.state = makeStore({
      notifications: [{ id: 'n1', title: 'A', message: 'm', is_read: true, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 0,
      total: 5,
    });
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText(t('common.actions.loadMore')));
    await user.click(screen.getByText(t('common.actions.loadMore')));
    expect(bellStore.state.loadMore).toHaveBeenCalled();
  });

  it('does not render the load more button when all are loaded', async () => {
    bellStore.state = makeStore({
      notifications: [{ id: 'n1', title: 'A', message: 'm', is_read: true, created_at: new Date().toISOString() }] as unknown as Notification[],
      unreadCount: 0,
      total: 1,
    });
    applyStore();
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('A'));
    expect(screen.queryByText(t('common.actions.loadMore'))).toBeNull();
  });
});
