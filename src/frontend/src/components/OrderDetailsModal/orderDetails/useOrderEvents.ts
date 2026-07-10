import { useCallback, useEffect, useState } from 'react';
import { orderService } from '@shared/services/orderService';
import type { OrderEvent } from '@shared/types/models';

import { extractEvents } from './orderDetails.helpers';

interface AxiosLikeError {
  response?: {
    status?: number;
    data?: { detail?: unknown };
  };
  name?: string;
}

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
      const err = error as AxiosLikeError;
      if (import.meta.env.DEV) {
        console.error('Order events fetch failed', {
          status: err?.response?.status,
          detail: err?.response?.data?.detail,
        });
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
      .catch((error: AxiosLikeError) => {
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.error('Order events fetch failed', {
              status: error?.response?.status,
              detail: error?.response?.data?.detail,
            });
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
