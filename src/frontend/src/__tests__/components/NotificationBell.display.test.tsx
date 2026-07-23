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

describe('NotificationBell display', () => {
  it('renders bell button', () => {
    render$();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows unread badge when unreadCount > 0', () => {
    bellStore.state = makeStore({ unreadCount: 3 });
    applyStore();
    render$();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows 9+ badge when unreadCount > 9', () => {
    bellStore.state = makeStore({ unreadCount: 15 });
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
      expect(screen.getByText(t('profile.notifications.title'))).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText(t('profile.notifications.empty'))).toBeInTheDocument();
    });
  });

  it('renders notifications list', async () => {
    bellStore.state = makeStore({
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

  it('groups notifications by day label', async () => {
    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();
    bellStore.state = makeStore({
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
    await waitFor(() => screen.getByText(t('common.time.today')));
    expect(screen.getByText(t('common.time.today'))).toBeInTheDocument();
    expect(screen.getByText(t('common.time.yesterday'))).toBeInTheDocument();
    expect(screen.getByText(t('common.time.daysAgo', { count: 6 }))).toBeInTheDocument();
  });

  it('labels notifications with a missing or invalid date as recent', async () => {
    bellStore.state = makeStore({
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
    expect(screen.getByText(t('common.time.recently'))).toBeInTheDocument();
  });

  it('closes the dropdown on an outside click', async () => {
    const user = userEvent.setup();
    render$();
    await user.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText(t('profile.notifications.title')));
    await user.click(document.body);
    await waitFor(() => {
      expect(screen.queryByText(t('profile.notifications.title'))).toBeNull();
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
