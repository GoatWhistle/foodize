import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useElapsedSeconds } from '../../hooks/useElapsedSeconds';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-15T10:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useElapsedSeconds', () => {
  it('returns 0 when no start iso', () => {
    const { result } = renderHook(() => useElapsedSeconds(null));
    expect(result.current).toBe(0);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current).toBe(0);
  });

  it('computes initial elapsed from start iso', () => {
    const start = new Date('2026-01-15T09:59:30Z').toISOString();
    const { result } = renderHook(() => useElapsedSeconds(start));
    expect(result.current).toBe(30);
  });

  it('ticks every second', () => {
    const start = new Date('2026-01-15T10:00:00Z').toISOString();
    const { result } = renderHook(() => useElapsedSeconds(start));
    expect(result.current).toBe(0);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current).toBe(2);
  });

  it('clears interval on unmount', () => {
    const clearSpy = vi.spyOn(global, 'clearInterval');
    const start = new Date('2026-01-15T10:00:00Z').toISOString();
    const { unmount } = renderHook(() => useElapsedSeconds(start));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
