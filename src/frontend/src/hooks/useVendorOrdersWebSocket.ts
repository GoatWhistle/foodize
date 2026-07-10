import { useEffect, useRef } from "react";
import type { ReliableWebSocket } from "@shared/services/api";
import { createRestaurantOrdersWebSocket } from "../services/api";

type OrdersMessageHandler = (data: Record<string, unknown>) => void;

export function useVendorOrdersWebSocket(
  restaurantId: string | null | undefined,
  activeTab: string,
  onMessage: OrdersMessageHandler,
): void {
  const wsRef = useRef<ReliableWebSocket | null>(null);

  useEffect(() => {
    if (!restaurantId || activeTab !== "orders") return;

    wsRef.current = createRestaurantOrdersWebSocket(restaurantId, onMessage);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [restaurantId, activeTab, onMessage]);
}
