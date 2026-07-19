import { logError } from "@shared/utils/logError";

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed";

export type UrlOrFactory = string | (() => string);
export type MessageHandler = (data: Record<string, unknown>) => void;
export type CloseHandler = () => void;
export type StatusHandler = (status: WebSocketStatus) => void;
export type TokenGetter = () => string | null | undefined;

const PING_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;
const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;

export class ReliableWebSocket {
  private urlOrFactory: UrlOrFactory;
  private onMessage: MessageHandler;
  private onClose?: CloseHandler | undefined;
  private onStatusChange?: StatusHandler | undefined;
  private getToken?: TokenGetter | undefined;
  private ws: WebSocket | null;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private isClosed: boolean;
  private pingInterval: ReturnType<typeof setInterval> | null;
  private pongTimeout: ReturnType<typeof setTimeout> | null;
  private status: WebSocketStatus;

  constructor(
    urlOrFactory: UrlOrFactory,
    onMessage: MessageHandler,
    onClose?: CloseHandler | null,
    onStatusChange?: StatusHandler | null,
    getToken?: TokenGetter,
  ) {
    this.urlOrFactory = urlOrFactory;
    this.onMessage = onMessage;
    this.onClose = onClose ?? undefined;
    this.onStatusChange = onStatusChange ?? undefined;
    this.getToken = getToken;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 20;
    this.isClosed = false;
    this.pingInterval = null;
    this.pongTimeout = null;
    this.status = "connecting";
    this.connect();
  }

  private updateStatus(newStatus: WebSocketStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.onStatusChange?.(newStatus);
  }

  private connect(): void {
    if (this.isClosed) return;
    this.updateStatus(
      this.reconnectAttempts > 0 ? "reconnecting" : "connecting",
    );
    const url =
      typeof this.urlOrFactory === "function"
        ? this.urlOrFactory()
        : this.urlOrFactory;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      if (this.isClosed) {
        this.ws?.close();
        return;
      }
      this.reconnectAttempts = 0;
      this.updateStatus("connected");
      const token = this.getToken?.();
      if (token) this.ws?.send(JSON.stringify({ token }));
      this.startHeartbeat();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as Record<
          string,
          unknown
        >;
        if (data['type'] === "pong") {
          this.resetPongTimeout();
          return;
        }
        if (data['type'] === "connected") {
          this.reconnectAttempts = 0;
          return;
        }
        if (data['error']) return;
        this.onMessage(data);
      } catch (err) {
        logError("reliableWebSocket.onmessage", err);
      }
    };

    this.ws.onclose = () => {
      this.cleanup();
      if (!this.isClosed) {
        this.reconnect();
      } else {
        this.updateStatus("closed");
        this.onClose?.();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
        this.resetPongTimeout();
      }
    }, PING_INTERVAL_MS);
  }

  private resetPongTimeout(): void {
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
    this.pongTimeout = setTimeout(() => {
      this.ws?.close();
    }, PONG_TIMEOUT_MS);
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateStatus("closed");
      this.onClose?.();
      return;
    }
    this.updateStatus("reconnecting");
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      RECONNECT_MAX_DELAY_MS,
    );
    this.reconnectAttempts++;
    setTimeout(() => { this.connect(); }, delay);
  }

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  close(): void {
    this.isClosed = true;
    this.cleanup();
    if (this.ws) {
      if (this.ws.readyState === WebSocket.CONNECTING) {
        this.updateStatus("closed");
        this.onClose?.();
        return;
      }
      this.ws.onclose = null;
      this.ws.close();
      this.updateStatus("closed");
      this.onClose?.();
    }
  }
}
