import { logError } from "@shared/utils/logError";

export interface OptimisticMutationParams<TState, TKey extends keyof TState> {
  get: () => TState;
  set: (partial: Pick<TState, TKey>) => void;
  keys: readonly TKey[];
  apply: () => void;
  commit: () => Promise<unknown>;
  context: string;
}

export const optimisticMutation = async <TState, TKey extends keyof TState>({
  get,
  set,
  keys,
  apply,
  commit,
  context,
}: OptimisticMutationParams<TState, TKey>): Promise<void> => {
  const state = get();
  const snapshot = {} as Pick<TState, TKey>;
  for (const key of keys) {
    snapshot[key] = state[key];
  }

  apply();

  try {
    await commit();
  } catch (err) {
    logError(context, err);
    set(snapshot);
  }
};
