import { useState, useEffect, useCallback } from "react";
import type { Dispatch, SetStateAction, RefObject } from "react";
import { useShallow } from "zustand/react/shallow";
import { useOrdersStore } from "@shared/store/useOrdersStore.instance";
import type { OrdersStoreState } from "@shared/store/createOrdersStore";
import { useInfiniteList } from "@shared/hooks/useInfiniteList";
import { logError } from "@shared/utils/logError";
import type { Order } from "@shared/types/models";

const getOrderId = (order: Order): string => order.id;

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
  const { orders, ordersTotal, fetchMyOrders, ordersLoading, ordersError } = useOrdersStore(
    useShallow((s: OrdersStoreState) => ({
      orders: s.orders,
      ordersTotal: s.ordersTotal,
      fetchMyOrders: s.fetchMyOrders,
      ordersLoading: s.ordersLoading,
      ordersError: s.ordersError,
    })),
  );

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setPage(1);
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchMyOrders({
      page,
      size: pageSize,
      status: statusFilter === "DONE" ? "COMPLETED" : undefined,
    }).catch((err: unknown) => { logError("useOrdersPageLogic.fetchMyOrders", err); });
  }, [page, statusFilter, fetchMyOrders, pageSize, refreshKey]);

  const {
    accumulated: allOrders,
    hasMore,
    sentinelRef,
  } = useInfiniteList<Order>({
    items: orders,
    total: ordersTotal || 0,
    page,
    pageSize,
    resetKey: `${statusFilter}:${refreshKey}`,
    loading: ordersLoading,
    infiniteScroll,
    getId: getOrderId,
    onLoadMore: () => { setPage((p) => p + 1); },
  });

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
