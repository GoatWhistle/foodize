import { useEffect, useRef } from "react";
import { createRestaurantOrdersWebSocket } from "../services/api";

export function useVendorOrdersWebSocket(restaurantId, activeTab, onMessage) {
  const wsRef = useRef(null);

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
