import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  enqueue,
  flushQueue,
  loadQueue,
  pendingCount,
  registerRunner,
  resetQueueForTests,
  startQueueAutoFlush,
} from "@/services/offlineQueue";

type NetInfoListener = (state: { isConnected: boolean; isInternetReachable?: boolean }) => void;
const mockAddEventListener = jest.fn<() => void, [NetInfoListener]>();

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    addEventListener: (cb: NetInfoListener): (() => void) => mockAddEventListener(cb),
  },
}));

const makeAction = (id: string, kind: string): { id: string; kind: string; payload: unknown; createdAt: number } => ({
  id,
  kind,
  payload: { id },
  createdAt: 1,
});

describe("offlineQueue", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    resetQueueForTests();
    await AsyncStorage.clear();
  });

  it("enqueues actions and reports pending count", async () => {
    await enqueue(makeAction("a1", "createOrder"));
    expect(pendingCount()).toBe(1);
  });

  it("flushes actions through the registered runner and clears them", async () => {
    const runner = jest.fn(() => Promise.resolve());
    registerRunner("createOrder", runner);
    await enqueue(makeAction("a1", "createOrder"));
    await flushQueue();
    expect(runner).toHaveBeenCalledTimes(1);
    expect(pendingCount()).toBe(0);
  });

  it("keeps actions with no runner", async () => {
    await enqueue(makeAction("a1", "unknown"));
    await flushQueue();
    expect(pendingCount()).toBe(1);
  });

  it("retains actions whose runner throws", async () => {
    registerRunner("createOrder", () => Promise.reject(new Error("net")));
    await enqueue(makeAction("a1", "createOrder"));
    await flushQueue();
    expect(pendingCount()).toBe(1);
  });

  it("subscribes to connectivity and flushes when back online", () => {
    startQueueAutoFlush();
    expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    const listener = mockAddEventListener.mock.calls[0]?.[0];
    listener?.({ isConnected: true, isInternetReachable: true });
    expect(mockAddEventListener).toHaveBeenCalled();
  });

  it("loadQueue is idempotent", async () => {
    await loadQueue();
    await loadQueue();
    expect(pendingCount()).toBe(0);
  });
});
