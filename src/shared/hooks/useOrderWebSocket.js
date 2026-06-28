import { useCallback, useEffect, useRef } from "react";
import { useOrderStore } from "@shared/store/useOrderStore.instance.js";

const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

export const useOrderWebSocket = (orderId, createOrderWebSocket, { onStatusChange } = {}) => {
  const wsRef = useRef(null);
  const fetchOrder = useOrderStore((s) => s.fetchOrder);

  const loadOrder = useCallback(() => fetchOrder(orderId), [orderId, fetchOrder]);

  useEffect(() => {
    if (!orderId || !createOrderWebSocket) return;
    loadOrder();

    wsRef.current = createOrderWebSocket(
      orderId,
      (data) => {
        if (data.error) return;
        const prev = useOrderStore.getState().currentOrder?.status;
        useOrderStore.setState({ currentOrder: data });
        if (prev && prev !== data.status) {
          onStatusChange?.(data.status, prev);
        }
      },
      () => {
        if (!TERMINAL_STATUSES.has(useOrderStore.getState().currentOrder?.status)) {
          loadOrder();
        }
      },
    );

    return () => wsRef.current?.close();
  }, [orderId, createOrderWebSocket, loadOrder, onStatusChange]);

  return { loadOrder };
};
