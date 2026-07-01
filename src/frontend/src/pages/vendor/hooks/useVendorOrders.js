import { useState, useEffect, useCallback } from 'react';
import { translateApiError } from '../../../utils/translateApiError';
import { orderService } from '../../../services/orderService';
import { useVendorOrdersWebSocket } from '../../../hooks/useVendorOrdersWebSocket';

export const useVendorOrders = ({ selectedRestaurant, activeTab }) => {
  const [restaurantOrders, setRestaurantOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('');
  const [ordersDateFromFilter, setOrdersDateFromFilter] = useState('');
  const [ordersDateToFilter, setOrdersDateToFilter] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ordersError, setOrdersError] = useState('');

  const fetchVendorOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!selectedRestaurant) return;
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
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setRestaurantOrders(list);
        setOrdersTotal(res.data?.pagination?.total || list.length);
      } catch (err) {
        setRestaurantOrders([]);
        setOrdersTotal(0);
        setOrdersError(
          translateApiError(
            err,
            'Не удалось загрузить заказы. Проверьте, что аккаунт вендора имеет доступ к этому заведению.'
          )
        );
      } finally {
        if (!silent) setOrdersLoading(false);
      }
    },
    [selectedRestaurant, ordersPage, ordersStatusFilter, ordersDateFromFilter, ordersDateToFilter]
  );

  useEffect(() => {
    if (selectedRestaurant && activeTab === 'orders') {
      fetchVendorOrders();
    }
  }, [selectedRestaurant, activeTab, ordersPage, ordersStatusFilter, ordersDateFromFilter, ordersDateToFilter, fetchVendorOrders]);

  const handleWsMessage = useCallback(() => {
    fetchVendorOrders({ silent: true });
  }, [fetchVendorOrders]);

  useVendorOrdersWebSocket(selectedRestaurant?.id, activeTab, handleWsMessage);

  const handleOrderChange = async (orderId, status, data = {}) => {
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
      setOrdersError(translateApiError(err, 'Не удалось изменить статус заказа'));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId, reason) => {
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
      setOrdersError(translateApiError(err, 'Не удалось отменить заказ'));
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
