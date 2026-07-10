import { ORDER_STATUS_RU } from '@shared/utils/locales';
import type { Order, OrderEvent, OrderItemOption, OrderStatus } from '@shared/types/models';

export const STATUS_LABEL_RU = ORDER_STATUS_RU;

export const STATUS_FLOW: OrderStatus[] = ['PENDING', 'ACCEPTED', 'READY', 'COMPLETED'];

export const CANCELLABLE_STATUSES = new Set<OrderStatus>(['PENDING', 'ACCEPTED']);

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const optionLabel = (option: OrderItemOption): string =>
  `${option.name}${option.price_delta ? ` +${option.price_delta} ₽` : ''}`;

export const buildReadyAtIso = (timeValue: string | null | undefined): string | null => {
  if (!timeValue) return null;

  const [hours, minutes] = timeValue.split(':').map(Number);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const readyAt = new Date();
  readyAt.setHours(hours, minutes, 0, 0);
  if (readyAt.getTime() <= Date.now()) {
    readyAt.setDate(readyAt.getDate() + 1);
  }

  return readyAt.toISOString();
};

export const getOrderDisplayId = (order: Order): string | number =>
  order.display_id ?? order.id.slice(0, 8);

export const extractEvents = (response: unknown): OrderEvent[] => {
  const res = response as { data?: unknown };
  const nested = (res?.data as { data?: unknown })?.data;
  if (Array.isArray(nested)) return nested as OrderEvent[];
  if (Array.isArray(res?.data)) return res.data as OrderEvent[];
  return [];
};

export type StageState = 'done' | 'current' | 'next';

export interface OrderStage {
  status: OrderStatus;
  event: OrderEvent | undefined;
  at: string | null | undefined;
  state: StageState;
}

export const getOrderStages = (order: Order, events: OrderEvent[] | null | undefined): OrderStage[] => {
  const eventByStatus = new Map<OrderStatus, OrderEvent>(
    (events || []).map((event) => [event.new_status, event])
  );
  const currentIndex = STATUS_FLOW.indexOf(order.status);

  return STATUS_FLOW.map((status, index) => ({
    status,
    event: eventByStatus.get(status),
    at:
      status === 'PENDING'
        ? order.created_at
        : eventByStatus.get(status)?.created_at,
    state:
      index < currentIndex
        ? 'done'
        : index === currentIndex
          ? 'current'
          : 'next',
  }));
};
