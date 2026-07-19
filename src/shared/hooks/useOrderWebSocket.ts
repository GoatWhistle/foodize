import { useCallback, useEffect, useRef } from "react";
import { useOrdersStore } from "@shared/store/useOrdersStore.instance";
import { parseOrderMessage } from "@shared/utils/wsMessages";
import type { ReliableWebSocket } from "@shared/services/api";
import type { Order, OrderStatus } from "@shared/types/models";

const TERMINAL_STATUSES = new Set<OrderStatus>(["COMPLETED", "CANCELLED"]);

export type CreateOrderWebSocket = (
  orderId: string,
  onMessage: (data: Record<string, unknown>) => void,
  onClose?: () => void,
  onStatusChange?: (status: string) => void,
) => ReliableWebSocket;

export interface UseOrderWebSocketOptions {
  onStatusChange?: (next: OrderStatus, prev: OrderStatus) => void;
}

export interface UseOrderWebSocketResult {
  loadOrder: () => Promise<Order>;
}

export const useOrderWebSocket = (
  orderId: string,
  createOrderWebSocket: CreateOrderWebSocket | null | undefined,
  { onStatusChange }: UseOrderWebSocketOptions = {},
): UseOrderWebSocketResult => {
  const wsRef = useRef<ReliableWebSocket | null>(null);
  const fetchOrder = useOrdersStore((s) => s.fetchOrder);

  const loadOrder = useCallback(() => fetchOrder(orderId), [orderId, fetchOrder]);

  useEffect(() => {
    if (!orderId || !createOrderWebSocket) return;
    void loadOrder();

    wsRef.current = createOrderWebSocket(
      orderId,
      (data) => {
        if (data['error']) return;
        const order = parseOrderMessage(data);
        if (!order) return;
        const prev = useOrdersStore.getState().currentOrder?.status;
        useOrdersStore.setState({ currentOrder: order });
        if (prev && prev !== order.status) {
          onStatusChange?.(order.status, prev);
        }
      },
      () => {
        const status = useOrdersStore.getState().currentOrder?.status;
        if (!status || !TERMINAL_STATUSES.has(status)) {
          void loadOrder();
        }
      },
    );

    return () => wsRef.current?.close();
  }, [orderId, createOrderWebSocket, loadOrder, onStatusChange]);

  return { loadOrder };
};
