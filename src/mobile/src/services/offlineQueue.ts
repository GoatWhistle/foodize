import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { logError } from "@shared/utils/logError";

const STORAGE_KEY = "foodize-offline-queue";

export interface QueuedAction {
  id: string;
  kind: string;
  payload: unknown;
  createdAt: number;
}

type Runner = (action: QueuedAction) => Promise<void>;

const runners = new Map<string, Runner>();
let queue: QueuedAction[] = [];
let loaded = false;
let flushing = false;

export function registerRunner(kind: string, runner: Runner): void {
  runners.set(kind, runner);
}

async function persist(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export async function loadQueue(): Promise<void> {
  if (loaded) return;
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      queue = JSON.parse(raw) as QueuedAction[];
    } catch (error) {
      logError("offlineQueue.load", error);
      queue = [];
    }
  }
  loaded = true;
}

export async function enqueue(action: QueuedAction): Promise<void> {
  await loadQueue();
  queue.push(action);
  await persist();
}

export function pendingCount(): number {
  return queue.length;
}

export async function flushQueue(): Promise<void> {
  if (flushing) return;
  await loadQueue();
  flushing = true;
  try {
    const remaining: QueuedAction[] = [];
    for (const action of queue) {
      const runner = runners.get(action.kind);
      if (!runner) {
        remaining.push(action);
        continue;
      }
      try {
        await runner(action);
      } catch (error) {
        logError("offlineQueue.flush", error);
        remaining.push(action);
      }
    }
    queue = remaining;
    await persist();
  } finally {
    flushing = false;
  }
}

export function startQueueAutoFlush(): () => void {
  return NetInfo.addEventListener((state) => {
    const online = Boolean(state.isConnected) && state.isInternetReachable !== false;
    if (online) void flushQueue();
  });
}

export function resetQueueForTests(): void {
  queue = [];
  loaded = false;
  flushing = false;
  runners.clear();
}
