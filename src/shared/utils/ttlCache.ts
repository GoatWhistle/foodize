export interface TtlCache<T> {
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
  clear: () => void;
}

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export const createTtlCache = <T>(ttlMs: number): TtlCache<T> => {
  const store = new Map<string, Entry<T>>();

  return {
    get: (key) => {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (performance.now() > entry.expiresAt) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set: (key, value) => {
      store.set(key, { value, expiresAt: performance.now() + ttlMs });
    },
    clear: () => { store.clear(); },
  };
};
