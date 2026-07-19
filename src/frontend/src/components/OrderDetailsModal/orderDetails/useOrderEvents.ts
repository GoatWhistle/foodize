import { useCallback, useEffect, useState } from 'react';
import { orderService } from '@shared/services/orderService';
import type { OrderEvent } from '@shared/types/models';

import { extractEvents } from './orderDetails.helpers';

const extractErrorInfo = (error: unknown): { status?: unknown; detail?: unknown } => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return {};
  const { response } = error as { response?: unknown };
  if (typeof response !== 'object' || response === null) return {};
  const errorResponse = response as { status?: unknown; data?: unknown };
  const responseBody =
    typeof errorResponse.data === 'object' && errorResponse.data !== null
      ? (errorResponse.data as { detail?: unknown })
      : undefined;
  return { status: errorResponse.status, detail: responseBody?.detail };
};

const logEventsFetchFailure = (error: unknown): void => {
  if (!import.meta.env['DEV']) return;
  const { status, detail } = extractErrorInfo(error);
  console.error('Order events fetch failed', { status, detail });
};

export interface UseOrderEventsResult {
  events: OrderEvent[];
  eventsLoading: boolean;
  eventsUnavailable: boolean;
  loadEvents: () => Promise<void>;
}

export const useOrderEvents = (orderId: string | undefined): UseOrderEventsResult => {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsUnavailable, setEventsUnavailable] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!orderId) return;
    setEventsLoading(true);
    setEventsUnavailable(false);
    try {
      const eventsResponse = await orderService.getOrderEvents(orderId);
      setEvents(extractEvents(eventsResponse));
      setEventsUnavailable(false);
    } catch (error) {
      logEventsFetchFailure(error);
      setEvents([]);
      setEventsUnavailable(true);
    } finally {
      setEventsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return { events, eventsLoading, eventsUnavailable, loadEvents };
};
