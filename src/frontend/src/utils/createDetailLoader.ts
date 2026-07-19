import type { Dispatch, SetStateAction } from 'react';

export function createDetailLoader<T>(
  setLoading: Dispatch<SetStateAction<boolean>>,
  setSelected: Dispatch<SetStateAction<T>>,
  fetchFn: (id: string) => Promise<T>,
  errorMsg: string,
  setError: Dispatch<SetStateAction<string>>,
): (id: string) => Promise<void> {
  return async (id) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchFn(id);
      setSelected(data);
    } catch {
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };
}
