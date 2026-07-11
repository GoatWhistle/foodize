import { useState, useEffect, useRef, useCallback } from "react";
import type { Dispatch, SetStateAction, RefObject } from "react";
import { useShallow } from "zustand/react/shallow";
import { useOrderStore } from "@shared/store/useOrderStore.instance";
import type { OrderStoreState } from "@shared/store/useOrderStore";
import { logError } from "@shared/utils/logError";
import type { Order } from "@shared/types/models";

export interface UseOrdersPageLogicOptions {
  pageSize?: number;
  infiniteScroll?: boolean;
}

export interface UseOrdersPageLogicResult {
  statusFilter: string;
  setStatusFilter: Dispatch<SetStateAction<string>>;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  visibleOrders: Order[];
  allOrders: Order[];
  ordersLoading: boolean;
  ordersError: string | null;
  ordersTotal: number;
  totalPages: number;
  hasMore: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  refresh: () => void;
}

export const useOrdersPageLogic = ({
  pageSize = 20,
  infiniteScroll = false,
}: UseOrdersPageLogicOptions = {}): UseOrdersPageLogicResult => {
  const { orders, ordersTotal, fetchMyOrders, ordersLoading, ordersError } = useOrderStore(
    useShallow((s: OrderStoreState) => ({
      orders: s.orders,
      ordersTotal: s.ordersTotal,
      fetchMyOrders: s.fetchMyOrders,
      ordersLoading: s.ordersLoading,
      ordersError: s.ordersError,
    })),
  );

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(() => {
    setAllOrders([]);
    setPage(1);
    setHasMore(true);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    setAllOrders([]);
    setPage(1);
    setHasMore(true);
  }, [statusFilter]);

  useEffect(() => {
    fetchMyOrders({
      page,
      size: pageSize,
      status: statusFilter === "DONE" ? "COMPLETED" : undefined,
    }).catch((err) => logError("useOrdersPageLogic.fetchMyOrders", err));
  }, [page, statusFilter, fetchMyOrders, pageSize, refreshKey]);

  useEffect(() => {
    if (page === 1) {
      setAllOrders(orders);
    } else {
      setAllOrders((prev) => {
        const ids = new Set(prev.map((o) => o.id));
        return [...prev, ...orders.filter((o) => !ids.has(o.id))];
      });
    }
    setHasMore(page * pageSize < (ordersTotal || 0));
  }, [orders, ordersTotal, page, pageSize, statusFilter]);

  useEffect(() => {
    if (!infiniteScroll) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !ordersLoading) setPage((p) => p + 1);
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, ordersLoading, infiniteScroll]);

  const totalPages = Math.ceil((ordersTotal || 0) / pageSize);

  const visibleOrders =
    statusFilter === "ACTIVE"
      ? allOrders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED")
      : allOrders;

  return {
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    visibleOrders,
    allOrders,
    ordersLoading,
    ordersError,
    ordersTotal,
    totalPages,
    hasMore,
    sentinelRef,
    refresh,
  };
};
