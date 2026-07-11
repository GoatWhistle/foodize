import { WS_BASE_URL as SHARED_WS_BASE_URL } from "@shared/config";
import {
  ReliableWebSocket,
  type MessageHandler,
  type CloseHandler,
  type StatusHandler,
  type TokenGetter,
} from "@shared/services/reliableWebSocket";

const WS_BASE_URL = SHARED_WS_BASE_URL;

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
