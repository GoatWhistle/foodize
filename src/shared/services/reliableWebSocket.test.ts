import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import {
  ReliableWebSocket,
  type WebSocketStatus,
} from "@shared/services/reliableWebSocket";

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  simulateMessage(payload: unknown): void {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  simulateRawMessage(data: string): void {
    this.onmessage?.({ data });
  }

  simulateError(): void {
    this.onerror?.();
  }
}

const OPEN = MockWebSocket.OPEN;

describe("ReliableWebSocket", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const latest = (): MockWebSocket =>
    MockWebSocket.instances[MockWebSocket.instances.length - 1] as MockWebSocket;

  it("connects immediately and reports connected status on open", () => {
    const statuses: WebSocketStatus[] = [];
    new ReliableWebSocket("ws://x", vi.fn(), null, (s) => statuses.push(s));
    expect(MockWebSocket.instances).toHaveLength(1);
    latest().simulateOpen();
    expect(statuses).toContain("connected");
  });

  it("resolves a url factory on connect", () => {
    const factory = vi.fn(() => "ws://factory");
    new ReliableWebSocket(factory, vi.fn());
    expect(factory).toHaveBeenCalled();
    expect(latest().url).toBe("ws://factory");
  });

  it("sends the auth token frame on open when getToken returns a value", () => {
    new ReliableWebSocket("ws://x", vi.fn(), null, null, () => "tok");
    latest().simulateOpen();
    expect(latest().sent).toContain(JSON.stringify({ token: "tok" }));
  });

  it("forwards regular messages to onMessage", () => {
    const onMessage = vi.fn();
    new ReliableWebSocket("ws://x", onMessage);
    latest().simulateOpen();
    latest().simulateMessage({ id: "o1", status: "PENDING" });
    expect(onMessage).toHaveBeenCalledWith({ id: "o1", status: "PENDING" });
  });

  it("ignores pong, connected and error control frames", () => {
    const onMessage = vi.fn();
    new ReliableWebSocket("ws://x", onMessage);
    latest().simulateOpen();
    latest().simulateMessage({ type: "pong" });
    latest().simulateMessage({ type: "connected" });
    latest().simulateMessage({ error: "nope" });
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("swallows invalid JSON without throwing", () => {
    const onMessage = vi.fn();
    new ReliableWebSocket("ws://x", onMessage);
    latest().simulateOpen();
    expect(() => { latest().simulateRawMessage("{not json"); }).not.toThrow();
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("closes the socket on error", () => {
    new ReliableWebSocket("ws://x", vi.fn());
    const ws = latest();
    ws.simulateOpen();
    const closeSpy = vi.spyOn(ws, "close");
    ws.simulateError();
    expect(closeSpy).toHaveBeenCalled();
  });

  it("reconnects with backoff after an unexpected close", () => {
    const statuses: WebSocketStatus[] = [];
    new ReliableWebSocket("ws://x", vi.fn(), null, (s) => statuses.push(s));
    latest().simulateOpen();
    expect(MockWebSocket.instances).toHaveLength(1);
    latest().onclose?.();
    expect(statuses).toContain("reconnecting");
    vi.advanceTimersByTime(1000);
    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it("increases the delay between reconnect attempts", () => {
    new ReliableWebSocket("ws://x", vi.fn());
    latest().onclose?.();
    vi.advanceTimersByTime(1000);
    expect(MockWebSocket.instances).toHaveLength(2);
    latest().onclose?.();
    vi.advanceTimersByTime(1999);
    expect(MockWebSocket.instances).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances).toHaveLength(3);
  });

  it("sends a ping and closes on missing pong after the heartbeat interval", () => {
    new ReliableWebSocket("ws://x", vi.fn());
    const ws = latest();
    ws.simulateOpen();
    vi.advanceTimersByTime(30_000);
    expect(ws.sent).toContain(JSON.stringify({ type: "ping" }));
    const closeSpy = vi.spyOn(ws, "close");
    vi.advanceTimersByTime(10_000);
    expect(closeSpy).toHaveBeenCalled();
  });

  it("resets the pong timeout when a pong is received", () => {
    new ReliableWebSocket("ws://x", vi.fn());
    const ws = latest();
    ws.simulateOpen();
    vi.advanceTimersByTime(30_000);
    ws.simulateMessage({ type: "pong" });
    const closeSpy = vi.spyOn(ws, "close");
    vi.advanceTimersByTime(9_000);
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it("manual close stops reconnection and reports closed", () => {
    const onClose = vi.fn();
    const statuses: WebSocketStatus[] = [];
    const rws = new ReliableWebSocket(
      "ws://x",
      vi.fn(),
      onClose,
      (s) => statuses.push(s),
    );
    const ws = latest();
    ws.simulateOpen();
    rws.close();
    expect(statuses).toContain("closed");
    expect(onClose).toHaveBeenCalled();
    const countBefore = MockWebSocket.instances.length;
    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.instances).toHaveLength(countBefore);
  });

  it("closing during CONNECTING reports closed without reconnecting", () => {
    const onClose = vi.fn();
    const rws = new ReliableWebSocket("ws://x", vi.fn(), onClose);
    rws.close();
    expect(onClose).toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it("closes immediately if the socket opens after being closed", () => {
    const rws = new ReliableWebSocket("ws://x", vi.fn());
    const ws = latest();
    rws.close();
    const closeSpy = vi.spyOn(ws, "close");
    ws.readyState = OPEN;
    ws.onopen?.();
    expect(closeSpy).toHaveBeenCalled();
  });
});
