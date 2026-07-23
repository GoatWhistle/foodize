import { vi } from 'vitest';
import type { Notification } from '@shared/types/models';

export type NotificationStoreState = {
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

export const makeStore = (overrides: Partial<NotificationStoreState> = {}): NotificationStoreState => ({
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

export const bellStore = { state: makeStore() };
