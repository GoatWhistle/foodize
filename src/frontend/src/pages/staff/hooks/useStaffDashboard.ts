import { useState, useEffect, useRef, useCallback } from 'react';
import { staffService } from '@shared/services/staffService';
import { translateApiError } from '@shared/utils/translateApiError';
import { logError } from '@shared/utils/logError';
import { createRestaurantOrdersWebSocket } from '../../../services/api';
import type { ReliableWebSocket } from '@shared/services/api';
import { COLUMN_DEFS } from '../staffColumns';
import type { StaffColumnDef } from '../staffColumns';
import type { StaffProfile, MenuItem, OrderStatus } from '@shared/types/models';
import type { StaffOrder, EtaPayload } from '../types';

type StaffTab = 'orders' | 'menu';

export const useStaffDashboard = () => {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [orderActionError, setOrderActionError] = useState('');
  const [activeTab, setActiveTab] = useState<StaffTab>('orders');
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState('');
  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null);
  const [etaOrder, setEtaOrder] = useState<StaffOrder | null>(null);
  const [autoEta, setAutoEta] = useState(
    () => localStorage.getItem('staff_auto_eta') === 'true'
  );

  const draggingOrderRef = useRef<StaffOrder | null>(null);
  const prevOrderIds = useRef<Set<string>>(new Set());
  const wsRef = useRef<ReliableWebSocket | null>(null);

  const fetchOrders = useCallback(async (restaurantId: string, silent = false) => {
    if (!silent) setOrdersLoading(true);
    try {
      const res = await staffService.getRestaurantOrders(restaurantId);
      const newOrders = res.data.data as StaffOrder[];
      const newIds = new Set(newOrders.map((o) => o.id));
      const hasNew = [...newIds].some((id) => !prevOrderIds.current.has(id));
      if (hasNew && prevOrderIds.current.size > 0) setNewOrderAlert(true);
      prevOrderIds.current = newIds;
      setOrders(newOrders);
    } finally {
      if (!silent) setOrdersLoading(false);
    }
  }, []);

  const fetchMenu = useCallback(async (restaurantId: string) => {
    setMenuLoading(true);
    setMenuError('');
    try {
      const res = await staffService.getMenu(restaurantId);
      setMenuItems(res.data.data);
    } catch {
      setMenuError('Не удалось загрузить меню');
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    staffService
      .getMyProfile()
      .then((res) => {
        setProfile(res.data.data);
      })
      .catch(() => { setProfileError('error'); })
      .finally(() => { setProfileLoading(false); });
  }, []);

  useEffect(() => {
    if (!profile) return;
    const restaurantId = profile.restaurant_id;
    Promise.all([
      fetchOrders(restaurantId),
      fetchMenu(restaurantId),
    ]).catch((err: unknown) => { logError('useStaffDashboard.initialLoad', err); });
  }, [profile, fetchOrders, fetchMenu]);

  useEffect(() => {
    if (!profile?.restaurant_id) return;
    const ws = createRestaurantOrdersWebSocket(profile.restaurant_id, () => {
      void fetchOrders(profile.restaurant_id, true);
    });
    wsRef.current = ws;
    return () => { ws.close(); };
  }, [profile?.restaurant_id, fetchOrders]);

  const doStatusChange = async (orderId: string, status: OrderStatus) => {
    if (!profile) return;
    setUpdating(orderId);
    try {
      await staffService.updateOrderStatus(orderId, status);
      await fetchOrders(profile.restaurant_id, true);
    } catch (err) {
      setOrderActionError(translateApiError(err, 'Не удалось обновить статус'));
    } finally {
      setUpdating(null);
    }
  };

  const acceptOrder = async (orderId: string, etaPayload: EtaPayload) => {
    if (!profile) return;
    setUpdating(orderId);
    try {
      await staffService.updateOrderStatus(orderId, 'ACCEPTED', etaPayload);
      await fetchOrders(profile.restaurant_id, true);
    } catch (err) {
      setOrderActionError(translateApiError(err, 'Не удалось принять заказ'));
    } finally {
      setUpdating(null);
    }
  };

  const triggerCooking = (order: StaffOrder) => {
    if (autoEta) {
      const times = order.items.map((i) => i.menu_item_prep_time).filter(Boolean);
      const minutes = times.length > 0 ? Math.max(...times) : 15;
      void acceptOrder(order.id, { estimated_ready_in_minutes: minutes });
    } else {
      setEtaOrder(order);
    }
  };

  const handleAdvance = (order: StaffOrder) => {
    if (order.status === 'PENDING') {
      triggerCooking(order);
    } else {
      void doStatusChange(order.id, order.status === 'ACCEPTED' ? 'READY' : 'COMPLETED');
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string | null) => {
    if (!profile) return;
    setUpdating(orderId);
    try {
      await staffService.cancelOrder(orderId, reason);
      await fetchOrders(profile.restaurant_id, true);
    } catch (err) {
      setOrderActionError(translateApiError(err, 'Не удалось отменить заказ'));
    } finally {
      setUpdating(null);
    }
  };

  const handleDrop = (column: StaffColumnDef) => {
    const order = draggingOrderRef.current;
    if (!order) return;
    const currentCol = COLUMN_DEFS.find((c) => c.statuses.includes(order.status));
    if (!currentCol || currentCol.id === column.id) return;

    if (column.id === 'accepted' && order.status === 'PENDING') {
      triggerCooking(order);
    } else if (column.id === 'ready' && order.status === 'ACCEPTED') {
      void doStatusChange(order.id, 'READY');
    }
  };

  const handleEtaConfirm = (etaPayload: EtaPayload) => {
    const order = etaOrder;
    setEtaOrder(null);
    if (order) void acceptOrder(order.id, etaPayload);
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    if (!profile) return;
    const newVal = !item.is_available;
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_available: newVal } : i))
    );
    try {
      await staffService.toggleMenuItemAvailability(
        profile.restaurant_id,
        item.id,
        newVal
      );
    } catch {
      setMenuItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_available: !newVal } : i
        )
      );
      setMenuError('Не удалось изменить статус блюда');
    }
  };

  const onDragStart = (order: StaffOrder) => {
    draggingOrderRef.current = order;
    setDraggingOrderId(order.id);
  };

  const onDragEnd = () => {
    setTimeout(() => {
      draggingOrderRef.current = null;
      setDraggingOrderId(null);
    }, 0);
  };

  return {
    profile,
    profileLoading,
    profileError,
    orders,
    ordersLoading,
    updating,
    orderActionError,
    activeTab,
    setActiveTab,
    newOrderAlert,
    setNewOrderAlert,
    menuItems,
    menuLoading,
    menuError,
    draggingOrderId,
    etaOrder,
    setEtaOrder,
    autoEta,
    setAutoEta,
    handleAdvance,
    handleCancelOrder,
    handleDrop,
    handleEtaConfirm,
    handleToggleAvailability,
    onDragStart,
    onDragEnd,
  };
};
