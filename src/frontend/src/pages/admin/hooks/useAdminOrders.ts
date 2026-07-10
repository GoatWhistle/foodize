import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { adminService } from '../../../services/adminService';
import { useDebounce } from '@shared/utils/useDebounce';
import type { Order, SuccessListResponse } from '@shared/types/models';

const PAGE_SIZE = 20;

export interface UseAdminOrdersArgs {
  activeTab: string;
  setActionError: Dispatch<SetStateAction<string>>;
}

export interface OrderFilters {
  status: string;
  date_from: string;
  date_to: string;
}

export const useAdminOrders = ({ activeTab, setActionError }: UseAdminOrdersArgs) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderFilters, setOrderFilters] = useState<OrderFilters>({ status: '', date_from: '', date_to: '' });
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
        const body = res.data as SuccessListResponse<Order>;
        setOrders(body.data || []);
        setOrdersTotal(body.pagination?.total || 0);
      })
      .catch(() => setActionError('Не удалось загрузить заказы'))
      .finally(() => setOrdersLoading(false));
  }, [activeTab, ordersPage, orderFilters, orderSearch, setActionError]);

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
