import { useState, useEffect } from 'react';
import { adminService } from '../../../services/adminService';
import { useDebounce } from '../../../hooks/useDebounce';

const PAGE_SIZE = 20;

export const useAdminOrders = ({ activeTab, setActionError }) => {
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderFilters, setOrderFilters] = useState({ status: '', date_from: '', date_to: '' });
  const [orderSearchRaw, setOrderSearchRaw] = useState('');

  const orderSearch = useDebounce(orderSearchRaw);

  useEffect(() => {
    if (activeTab !== 'orders' && activeTab !== 'resolution') return;
    setOrdersLoading(true);
    adminService
      .getOrders({
        page: ordersPage,
        size: PAGE_SIZE,
        status: orderFilters.status || undefined,
        search: orderSearch || undefined,
        date_from: orderFilters.date_from || undefined,
        date_to: orderFilters.date_to || undefined,
      })
      .then((res) => {
        setOrders(res.data.data || []);
        setOrdersTotal(res.data.pagination?.total || 0);
      })
      .catch(() => setActionError('Не удалось загрузить заказы'))
      .finally(() => setOrdersLoading(false));
  }, [activeTab, ordersPage, orderFilters, orderSearch]);

  return {
    orders,
    ordersPage, setOrdersPage,
    ordersTotal,
    ordersLoading,
    selectedOrder, setSelectedOrder,
    orderFilters, setOrderFilters,
    orderSearchRaw, setOrderSearchRaw,
  };
};
