import { useCallback, useEffect, useState } from 'react';
import { orderService } from '@shared/services/orderService';
import type { OrderEvent } from '@shared/types/models';

import { extractEvents } from './orderDetails.helpers';

const extractErrorInfo = (error: unknown): { status?: unknown; detail?: unknown } => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return {};
  const { response } = error as { response?: unknown };
  if (typeof response !== 'object' || response === null) return {};
  const resp = response as { status?: unknown; data?: unknown };
  const data = typeof resp.data === 'object' && resp.data !== null ? (resp.data as { detail?: unknown }) : undefined;
  return { status: resp.status, detail: data?.detail };
};

export interface UseOrderEventsResult {
  events: OrderEvent[];
  eventsLoading: boolean;
  eventsError: string;
  eventsUnavailable: boolean;
  loadEvents: () => Promise<void>;
}

export const useOrderEvents = (orderId: string | undefined): UseOrderEventsResult => {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');
  const [eventsUnavailable, setEventsUnavailable] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!orderId) return;
    setEventsLoading(true);
    setEventsError('');
    setEventsUnavailable(false);
    try {
      const res = await orderService.getOrderEvents(orderId);
      setEvents(extractEvents(res));
      setEventsUnavailable(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        const { status, detail } = extractErrorInfo(error);
        console.error('Order events fetch failed', { status, detail });
      }
      setEvents([]);
      setEventsError('');
      setEventsUnavailable(true);
    } finally {
      setEventsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;
    setEventsLoading(true);
    setEventsError('');
    setEventsUnavailable(false);
    if (!orderId) {
      setEventsLoading(false);
      return;
    }
    orderService
      .getOrderEvents(orderId)
      .then((res) => {
        if (!cancelled) {
          setEvents(extractEvents(res));
          setEventsUnavailable(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            const { status, detail } = extractErrorInfo(error);
            console.error('Order events fetch failed', { status, detail });
          }
          setEvents([]);
          setEventsUnavailable(true);
        }
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return { events, eventsLoading, eventsError, eventsUnavailable, loadEvents };
};
