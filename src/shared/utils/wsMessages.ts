import type { Order, Notification } from '@shared/types/models';

export function parseOrderMessage(data: Record<string, unknown>): Order | null {
  if (typeof data.id !== 'string') return null;
  if (typeof data.status !== 'string') return null;
  if (typeof data.display_id !== 'number') return null;
  return data as unknown as Order;
}

export function parseNotificationMessage(
  data: Record<string, unknown>,
): Notification | null {
  if (typeof data.id !== 'string') return null;
  if (typeof data.type !== 'string') return null;
  if (typeof data.title !== 'string') return null;
  if (typeof data.message !== 'string') return null;
  return data as unknown as Notification;
}
