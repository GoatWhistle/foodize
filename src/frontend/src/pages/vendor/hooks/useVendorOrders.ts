import { useState, useEffect, useCallback, useRef } from 'react';
import { translateApiError } from '@shared/utils/translateApiError';
import { orderService } from '@shared/services/orderService';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Order, OrderStatus, OrderStatusUpdate, Restaurant } from '@shared/types/models';
import { useVendorOrdersWebSocket } from '../../../hooks/useVendorOrdersWebSocket';

type OrderStatusChangeData = Omit<OrderStatusUpdate, 'status'>;

interface UseVendorOrdersParams {
  selectedRestaurant: Restaurant | null;
  activeTab: string;
}

interface FetchOrdersOptions {
  silent?: boolean;
}

export const useVendorOrders = ({ selectedRestaurant, activeTab }: UseVendorOrdersParams) => {
  const { t } = useTranslation();
  const [restaurantOrders, setRestaurantOrders] = useState<Order[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('');
  const [ordersDateFromFilter, setOrdersDateFromFilter] = useState('');
  const [ordersDateToFilter, setOrdersDateToFilter] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ordersError, setOrdersError] = useState('');
  const requestSeqRef = useRef(0);

  const fetchVendorOrders = useCallback(
    async ({ silent = false }: FetchOrdersOptions = {}) => {
      if (!selectedRestaurant) return;
      const requestId = ++requestSeqRef.current;
      if (!silent) setOrdersLoading(true);
      setOrdersError('');
      try {
        const res = await orderService.getByRestaurant(selectedRestaurant.id, {
          page: ordersPage,
          size: 20,
          status: ordersStatusFilter || undefined,
          date_from: ordersDateFromFilter || undefined,
          date_to: ordersDateToFilter || undefined,
        });
        if (requestId !== requestSeqRef.current) return;
        const list = Array.isArray(res.data.data) ? res.data.data : [];
        setRestaurantOrders(list);
        setOrdersTotal(res.data.pagination.total || list.length);
      } catch (err) {
        if (requestId !== requestSeqRef.current) return;
        setRestaurantOrders([]);
        setOrdersTotal(0);
        setOrdersError(
          translateApiError(err, t('vendor.orders.errors.loadFailed'))
        );
      } finally {
        if (!silent && requestId === requestSeqRef.current) setOrdersLoading(false);
      }
    },
    [selectedRestaurant, ordersPage, ordersStatusFilter, ordersDateFromFilter, ordersDateToFilter, t]
  );

  useEffect(() => {
    if (selectedRestaurant && activeTab === 'orders') {
      void fetchVendorOrders();
    }
  }, [selectedRestaurant, activeTab, ordersPage, ordersStatusFilter, ordersDateFromFilter, ordersDateToFilter, fetchVendorOrders]);

  const handleWsMessage = useCallback(() => {
    void fetchVendorOrders({ silent: true });
  }, [fetchVendorOrders]);

  useVendorOrdersWebSocket(selectedRestaurant?.id, activeTab, handleWsMessage);

  const handleOrderChange = async (
    orderId: string,
    status: OrderStatus,
    data: OrderStatusChangeData = {}
  ) => {
    setOrdersError('');
    setUpdatingOrderId(orderId);
    try {
      await orderService.updateStatus(orderId, status, data);
      setSelectedOrder((current) =>
        current?.id === orderId
          ? {
              ...current,
              status,
              ...(data.estimated_ready_in_minutes
                ? {
                    estimated_ready_at: new Date(
                      Date.now() + data.estimated_ready_in_minutes * 60000
                    ).toISOString(),
                  }
                : {}),
              ...(data.estimated_ready_at ? { estimated_ready_at: data.estimated_ready_at } : {}),
            }
          : current
      );
      await fetchVendorOrders({ silent: true });
    } catch (err) {
      setOrdersError(translateApiError(err, t('vendor.orders.errors.statusChangeFailed')));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    setOrdersError('');
    setUpdatingOrderId(orderId);
    try {
      await orderService.cancelOrder(orderId, reason);
      setSelectedOrder((current) =>
        current?.id === orderId
          ? { ...current, status: 'CANCELLED', cancellation_reason: reason }
          : current
      );
      await fetchVendorOrders({ silent: true });
    } catch (err) {
      setOrdersError(translateApiError(err, t('vendor.orders.errors.cancelFailed')));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return {
    restaurantOrders,
    ordersPage, setOrdersPage,
    ordersTotal,
    ordersStatusFilter, setOrdersStatusFilter,
    ordersDateFromFilter, setOrdersDateFromFilter,
    ordersDateToFilter, setOrdersDateToFilter,
    ordersLoading,
    updatingOrderId,
    selectedOrder, setSelectedOrder,
    ordersError, setOrdersError,
    fetchVendorOrders,
    handleOrderChange,
    handleCancelOrder,
  };
};
