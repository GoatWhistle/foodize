import { describe, it, expect, vi } from 'vitest';
import type { Dispatch, SetStateAction } from 'react';
import { createDetailLoader } from '../../utils/createDetailLoader';

describe('createDetailLoader', () => {
  const setup = () => {
    const setLoading = vi.fn<Dispatch<SetStateAction<boolean>>>();
    const setSelected = vi.fn();
    const setError = vi.fn();
    return { setLoading, setSelected, setError };
  };

  it('calls fetchFn and sets selected on success', async () => {
    const { setLoading, setSelected, setError } = setup();
    const fetchFn = vi.fn().mockResolvedValue({ id: '1', name: 'Test' });

    const loader = createDetailLoader(setLoading, setSelected, fetchFn, 'Ошибка загрузки', setError);
    await loader('1');

    expect(setLoading).toHaveBeenCalledWith(true);
    expect(fetchFn).toHaveBeenCalledWith('1');
    expect(setSelected).toHaveBeenCalledWith({ id: '1', name: 'Test' });
    expect(setError).toHaveBeenCalledWith('');
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it('sets error message on failure', async () => {
    const { setLoading, setSelected, setError } = setup();
    const fetchFn = vi.fn().mockRejectedValue(new Error('network error'));

    const loader = createDetailLoader(setLoading, setSelected, fetchFn, 'Ошибка загрузки', setError);
    await loader('bad-id');

    expect(setSelected).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith('Ошибка загрузки');
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it('always resets loading to false after success', async () => {
    const { setLoading, setSelected, setError } = setup();
    const fetchFn = vi.fn().mockResolvedValue({});

    const loader = createDetailLoader(setLoading, setSelected, fetchFn, '', setError);
    await loader('x');

    const calls = setLoading.mock.calls.map(([v]) => v);
    expect(calls).toEqual([true, false]);
  });

  it('always resets loading to false after failure', async () => {
    const { setLoading, setSelected, setError } = setup();
    const fetchFn = vi.fn().mockRejectedValue(new Error());

    const loader = createDetailLoader(setLoading, setSelected, fetchFn, '', setError);
    await loader('x');

    const calls = setLoading.mock.calls.map(([v]) => v);
    expect(calls).toEqual([true, false]);
  });

  it('clears error before fetch', async () => {
    const { setLoading, setSelected, setError } = setup();
    const fetchFn = vi.fn().mockResolvedValue(null);

    const loader = createDetailLoader(setLoading, setSelected, fetchFn, '', setError);
    await loader('x');

    expect(setError.mock.calls[0]?.[0]).toBe('');
  });
});
