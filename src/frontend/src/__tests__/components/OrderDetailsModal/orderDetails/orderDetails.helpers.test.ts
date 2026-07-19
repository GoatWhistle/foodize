import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Order, OrderEvent, OrderItemOption } from '@shared/types/models';
import {
  STATUS_FLOW,
  CANCELLABLE_STATUSES,
  formatDateTime,
  optionLabel,
  buildReadyAtIso,
  getOrderDisplayId,
  extractEvents,
  getOrderStages,
} from '../../../../components/OrderDetailsModal/orderDetails/orderDetails.helpers';

afterEach(() => {
  vi.useRealTimers();
});

describe('orderDetails.helpers', () => {
  it('exposes status flow and cancellable set', () => {
    expect(STATUS_FLOW).toEqual(['PENDING', 'ACCEPTED', 'READY', 'COMPLETED']);
    expect(CANCELLABLE_STATUSES.has('PENDING')).toBe(true);
    expect(CANCELLABLE_STATUSES.has('COMPLETED')).toBe(false);
  });

  it('formatDateTime returns dash for empty', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
    expect(formatDateTime('')).toBe('—');
  });

  it('formatDateTime formats a value', () => {
    expect(formatDateTime('2026-01-15T10:00:00Z')).not.toBe('—');
  });

  it('optionLabel with and without price delta', () => {
    expect(optionLabel({ name: 'Сыр', price_delta: 50 } as OrderItemOption)).toBe('Сыр +50 ₽');
    expect(optionLabel({ name: 'Без лука', price_delta: 0 } as OrderItemOption)).toBe('Без лука');
  });

  it('buildReadyAtIso returns null for empty and invalid', () => {
    expect(buildReadyAtIso(null)).toBeNull();
    expect(buildReadyAtIso('')).toBeNull();
    expect(buildReadyAtIso('99:99')).toBeNull();
    expect(buildReadyAtIso('-1:00')).toBeNull();
    expect(buildReadyAtIso('12:xx')).toBeNull();
  });

  it('buildReadyAtIso builds iso for a future time today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T08:00:00'));
    const iso = buildReadyAtIso('10:30');
    expect(iso).not.toBeNull();
    expect(new Date(iso as string).getHours()).toBe(10);
  });

  it('buildReadyAtIso rolls to next day for a past time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T20:00:00'));
    const iso = buildReadyAtIso('08:00');
    expect(new Date(iso as string).getDate()).toBe(16);
  });

  it('getOrderDisplayId returns display id', () => {
    expect(getOrderDisplayId({ display_id: 'A-1' } as unknown as Order)).toBe('A-1');
  });

  it('extractEvents handles nested, flat, and empty shapes', () => {
    const ev = [{ id: 'e1' }] as unknown as OrderEvent[];
    expect(extractEvents({ data: { data: ev } })).toBe(ev);
    expect(extractEvents({ data: ev })).toBe(ev);
    expect(extractEvents({ data: { data: null } })).toEqual([]);
    expect(extractEvents({})).toEqual([]);
  });

  it('getOrderStages marks done/current/next and uses created_at for pending', () => {
    const order = { status: 'ACCEPTED', created_at: '2026-01-15T10:00:00Z' } as Order;
    const events = [
      { new_status: 'ACCEPTED', created_at: '2026-01-15T11:00:00Z' },
    ] as unknown as OrderEvent[];
    const stages = getOrderStages(order, events);
    expect(stages[0]?.state).toBe('done');
    expect(stages[0]?.at).toBe('2026-01-15T10:00:00Z');
    expect(stages[1]?.state).toBe('current');
    expect(stages[1]?.at).toBe('2026-01-15T11:00:00Z');
    expect(stages[2]?.state).toBe('next');
  });

  it('getOrderStages tolerates null events', () => {
    const order = { status: 'PENDING', created_at: '2026-01-15T10:00:00Z' } as Order;
    const stages = getOrderStages(order, null);
    expect(stages).toHaveLength(4);
    expect(stages[0]?.state).toBe('current');
    expect(stages[1]?.at).toBeUndefined();
  });
});
