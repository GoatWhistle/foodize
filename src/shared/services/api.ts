import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const WS_BASE_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1"
)
  .replace(/^http/, "ws")
  .replace(/\/api\/v1$/, "");

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed";

type UrlOrFactory = string | (() => string);
type MessageHandler = (data: Record<string, unknown>) => void;
type CloseHandler = () => void;
type StatusHandler = (status: WebSocketStatus) => void;
type TokenGetter = () => string | null | undefined;

export class ReliableWebSocket {
  private urlOrFactory: UrlOrFactory;
  private onMessage: MessageHandler;
  private onClose?: CloseHandler;
  private onStatusChange?: StatusHandler;
  private getToken?: TokenGetter;
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
        if (data.type === "pong") {
          this.resetPongTimeout();
          return;
        }
        if (data.type === "connected") {
          this.reconnectAttempts = 0;
          return;
        }
        if (data.error) return;
        this.onMessage(data);
      } catch {
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
    }, 30000);
  }

  private resetPongTimeout(): void {
    if (this.pongTimeout) clearTimeout(this.pongTimeout);
    this.pongTimeout = setTimeout(() => {
      this.ws?.close();
    }, 10000);
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateStatus("closed");
      this.onClose?.();
      return;
    }
    this.updateStatus("reconnecting");
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
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

export interface CreateApiOptions {
  getToken?: TokenGetter;
  onUnauthorized?: () => void;
  refreshToken?: () => Promise<void>;
  withCredentials?: boolean;
  skipRetryUrls?: string[];
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

interface QueueItem {
  resolve: () => void;
  reject: (error: unknown) => void;
}

export function createApi({
  getToken,
  onUnauthorized,
  refreshToken,
  withCredentials = false,
  skipRetryUrls = [],
}: CreateApiOptions = {}): AxiosInstance {
  const BASE_URL =
    import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

  const api = axios.create({
    baseURL: BASE_URL,
    withCredentials,
    headers: { "Content-Type": "application/json" },
  });

  let isRefreshing = false;
  let failedQueue: QueueItem[] = [];

  const processQueue = (error: unknown): void => {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
    failedQueue = [];
  };

  if (getToken) {
    api.interceptors.request.use((config) => {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<{ detail?: unknown }>) => {
      const originalRequest = error.config as RetriableConfig | undefined;

      const detail = error.response?.data?.detail;
      if (
        detail &&
        typeof detail === "object" &&
        "error" in detail &&
        error.response
      ) {
        (error.response.data).detail = (
          detail
        ).error;
      }

      const isSkipUrl = skipRetryUrls.some((u) =>
        originalRequest?.url?.includes(u),
      );

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isSkipUrl &&
        refreshToken
      ) {
        if (isRefreshing) {
          return new Promise<void>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => api(originalRequest));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await refreshToken();
          processQueue(null);
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError);
          onUnauthorized?.();
          return Promise.reject(
            refreshError instanceof Error
              ? refreshError
              : new Error(String(refreshError)),
          );
        } finally {
          isRefreshing = false;
        }
      }

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry
      ) {
        onUnauthorized?.();
      }

      return Promise.reject(error);
    },
  );

  return api;
}

export function createWebSocketFactories(getToken?: TokenGetter) {
  const buildUrl =
    (path: string): (() => string) =>
    () =>
      `${WS_BASE_URL}/api/v1${path}`;

  return {
    createOrderWebSocket(
      orderId: string,
      onMessage: MessageHandler,
      onClose?: CloseHandler | null,
      onStatusChange?: StatusHandler | null,
    ): ReliableWebSocket {
      return new ReliableWebSocket(
        buildUrl(`/ws/orders/${orderId}`),
        onMessage,
        onClose,
        onStatusChange,
        getToken,
      );
    },

    createNotificationWebSocket(
      userId: string,
      onMessage: MessageHandler,
      onClose?: CloseHandler | null,
      onStatusChange?: StatusHandler | null,
    ): ReliableWebSocket {
      return new ReliableWebSocket(
        buildUrl(`/ws/notifications/${userId}`),
        onMessage,
        onClose,
        onStatusChange,
        getToken,
      );
    },

    createRestaurantOrdersWebSocket(
      restaurantId: string,
      onMessage: MessageHandler,
      onClose?: CloseHandler | null,
      onStatusChange?: StatusHandler | null,
    ): ReliableWebSocket {
      return new ReliableWebSocket(
        buildUrl(`/ws/restaurants/${restaurantId}/orders`),
        onMessage,
        onClose,
        onStatusChange,
        getToken,
      );
    },

    createDisplayBoardWebSocket(
      restaurantId: string,
      onMessage: MessageHandler,
      onClose?: CloseHandler | null,
      onStatusChange?: StatusHandler | null,
    ): ReliableWebSocket {
      return new ReliableWebSocket(
        buildUrl(`/ws/restaurants/${restaurantId}/display-board`),
        onMessage,
        onClose,
        onStatusChange,
        getToken,
      );
    },
  };
}
