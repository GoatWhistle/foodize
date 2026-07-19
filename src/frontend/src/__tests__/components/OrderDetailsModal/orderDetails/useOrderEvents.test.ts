import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { OrderEvent } from '@shared/types/models';

vi.mock('@shared/services/orderService', () => ({
  orderService: {
    getOrderEvents: vi.fn(),
  },
}));

const { orderService } = await import('@shared/services/orderService');
const { useOrderEvents } = await import(
  '../../../../components/OrderDetailsModal/orderDetails/useOrderEvents'
);

const EVENTS = [{ id: 'e1' }] as unknown as OrderEvent[];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useOrderEvents', () => {
  it('does not fetch when orderId is undefined', async () => {
    const { result } = renderHook(() => useOrderEvents(undefined));
    await waitFor(() => {
      expect(result.current.eventsLoading).toBe(false);
    });
    expect(orderService.getOrderEvents).not.toHaveBeenCalled();
    expect(result.current.events).toEqual([]);
  });

  it('loads events successfully', async () => {
    vi.mocked(orderService.getOrderEvents).mockResolvedValue({
      data: { data: EVENTS },
    } as unknown as Awaited<ReturnType<typeof orderService.getOrderEvents>>);
    const { result } = renderHook(() => useOrderEvents('order-1'));
    await waitFor(() => {
      expect(result.current.events).toEqual(EVENTS);
    });
    expect(result.current.eventsUnavailable).toBe(false);
    expect(orderService.getOrderEvents).toHaveBeenCalledWith('order-1');
  });

  it('marks unavailable on failure', async () => {
    vi.mocked(orderService.getOrderEvents).mockRejectedValue({
      response: { status: 404, data: { detail: 'nope' } },
    });
    const { result } = renderHook(() => useOrderEvents('order-1'));
    await waitFor(() => {
      expect(result.current.eventsUnavailable).toBe(true);
    });
    expect(result.current.events).toEqual([]);
  });

  it('handles error without a response object', async () => {
    vi.mocked(orderService.getOrderEvents).mockRejectedValue(new Error('plain'));
    const { result } = renderHook(() => useOrderEvents('order-1'));
    await waitFor(() => { expect(result.current.eventsUnavailable).toBe(true); });
  });

  it('handles error where response is not an object', async () => {
    vi.mocked(orderService.getOrderEvents).mockRejectedValue({ response: 'oops' });
    const { result } = renderHook(() => useOrderEvents('order-1'));
    await waitFor(() => { expect(result.current.eventsUnavailable).toBe(true); });
  });

  it('handles error where response.data is not an object', async () => {
    vi.mocked(orderService.getOrderEvents).mockRejectedValue({
      response: { status: 500, data: 'text' },
    });
    const { result } = renderHook(() => useOrderEvents('order-1'));
    await waitFor(() => { expect(result.current.eventsUnavailable).toBe(true); });
  });

  it('handles a non-object thrown value', async () => {
    vi.mocked(orderService.getOrderEvents).mockRejectedValue('string-error');
    const { result } = renderHook(() => useOrderEvents('order-1'));
    await waitFor(() => { expect(result.current.eventsUnavailable).toBe(true); });
  });

  it('skips logging when not in DEV', async () => {
    const devSpy = vi.spyOn(import.meta, 'env', 'get').mockReturnValue({ DEV: false });
    vi.mocked(orderService.getOrderEvents).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useOrderEvents('order-1'));
    await waitFor(() => { expect(result.current.eventsUnavailable).toBe(true); });
    devSpy.mockRestore();
  });

  it('reloads via loadEvents callback', async () => {
    vi.mocked(orderService.getOrderEvents).mockResolvedValue({
      data: { data: EVENTS },
    } as unknown as Awaited<ReturnType<typeof orderService.getOrderEvents>>);
    const { result } = renderHook(() => useOrderEvents('order-1'));
    await waitFor(() => { expect(result.current.events).toEqual(EVENTS); });
    await act(async () => {
      await result.current.loadEvents();
    });
    expect(orderService.getOrderEvents).toHaveBeenCalledTimes(2);
  });
});
