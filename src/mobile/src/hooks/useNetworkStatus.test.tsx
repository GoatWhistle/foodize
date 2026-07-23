import { act, renderHook } from "@testing-library/react-native";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

type NetInfoListener = (state: { isConnected: boolean; isInternetReachable?: boolean }) => void;
const mockAddEventListener = jest.fn<undefined, [NetInfoListener]>();
const mockUnsubscribe = jest.fn();

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    addEventListener: (cb: NetInfoListener): (() => void) => {
      mockAddEventListener(cb);
      return mockUnsubscribe;
    },
  },
}));

describe("useNetworkStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const emit = (state: { isConnected: boolean; isInternetReachable?: boolean }): void => {
    const listener = mockAddEventListener.mock.calls[0]?.[0];
    act(() => {
      listener?.(state);
    });
  };

  it("starts online and unsubscribes on unmount", () => {
    const { result, unmount } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("goes offline and back online with a reconnect flash", () => {
    const { result } = renderHook(() => useNetworkStatus());
    emit({ isConnected: false });
    expect(result.current.isOnline).toBe(false);
    emit({ isConnected: true, isInternetReachable: true });
    expect(result.current.isOnline).toBe(true);
    expect(result.current.justReconnected).toBe(true);
    act(() => {
      jest.advanceTimersByTime(2600);
    });
    expect(result.current.justReconnected).toBe(false);
  });

  it("treats unreachable internet as offline", () => {
    const { result } = renderHook(() => useNetworkStatus());
    emit({ isConnected: true, isInternetReachable: false });
    expect(result.current.isOnline).toBe(false);
  });
});
