import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CookingPot, CheckCircle, Clock, Bell } from '@phosphor-icons/react';
import { staffService } from '../../services/staffService';
import { STAFF_ROLE_RU, translate } from '../../utils/locales';
import { translateApiError } from '../../utils/translateApiError';
import EmptyState from '../../components/ui/EmptyState';
import { createRestaurantOrdersWebSocket } from '../../services/api';
import ApplicationStatus from './components/ApplicationStatus';
import EtaModal from './components/EtaModal';
import KanbanColumn from './components/KanbanColumn';

const COLUMN_DEFS = [
  { id: 'pending', label: 'Новые', statuses: ['PENDING'], color: '#f59e0b', Icon: Clock },
  { id: 'accepted', label: 'Принято', statuses: ['ACCEPTED'], color: '#f97316', Icon: CookingPot },
  { id: 'ready', label: 'Готово', statuses: ['READY'], color: '#22c55e', Icon: CheckCircle },
];

const StaffDashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [orderActionError, setOrderActionError] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState('');
  const [draggingOrderId, setDraggingOrderId] = useState(null);
  const [etaOrder, setEtaOrder] = useState(null);
  const [autoEta, setAutoEta] = useState(
    () => localStorage.getItem('staff_auto_eta') === 'true'
  );

  const draggingOrderRef = useRef(null);
  const prevOrderIds = useRef(new Set());
  const wsRef = useRef(null);

  const fetchOrders = useCallback(async (restaurantId, silent = false) => {
    if (!silent) setOrdersLoading(true);
    try {
      const res = await staffService.getRestaurantOrders(restaurantId);
      const newOrders = res.data.data ?? [];
      const newIds = new Set(newOrders.map((o) => o.id));
      const hasNew = [...newIds].some((id) => !prevOrderIds.current.has(id));
      if (hasNew && prevOrderIds.current.size > 0) setNewOrderAlert(true);
      prevOrderIds.current = newIds;
      setOrders(newOrders);
    } finally {
      if (!silent) setOrdersLoading(false);
    }
  }, []);

  const fetchMenu = useCallback(async (restaurantId) => {
    setMenuLoading(true);
    setMenuError('');
    try {
      const res = await staffService.getMenu(restaurantId);
      setMenuItems(res.data.data ?? []);
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
      .catch(() => setProfileError('error'))
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    if (!profile) return;
    fetchOrders(profile.restaurant_id);
    fetchMenu(profile.restaurant_id);
  }, [profile, fetchOrders, fetchMenu]);

  useEffect(() => {
    if (!profile?.restaurant_id) return;
    const ws = createRestaurantOrdersWebSocket(profile.restaurant_id, () =>
      fetchOrders(profile.restaurant_id, true)
    );
    wsRef.current = ws;
    return () => ws?.close();
  }, [profile?.restaurant_id, fetchOrders]);

  const doStatusChange = async (orderId, status) => {
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

  const acceptOrder = async (orderId, etaPayload) => {
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

  const triggerCooking = (order) => {
    if (autoEta) {
      const times = order.items?.map((i) => i.menu_item_prep_time).filter(Boolean) ?? [];
      const minutes = times.length > 0 ? Math.max(...times) : 15;
      acceptOrder(order.id, { estimated_ready_in_minutes: minutes });
    } else {
      setEtaOrder(order);
    }
  };

  const handleAdvance = (order) => {
    if (order.status === 'PENDING') {
      triggerCooking(order);
    } else {
      doStatusChange(order.id, order.status === 'ACCEPTED' ? 'READY' : 'COMPLETED');
    }
  };

  const handleCancelOrder = async (orderId, reason) => {
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

  const handleDrop = (column) => {
    const order = draggingOrderRef.current;
    if (!order) return;
    const currentCol = COLUMN_DEFS.find((c) => c.statuses.includes(order.status));
    if (!currentCol || currentCol.id === column.id) return;

    if (column.id === 'accepted' && order.status === 'PENDING') {
      triggerCooking(order);
    } else if (column.id === 'ready' && order.status === 'ACCEPTED') {
      doStatusChange(order.id, 'READY');
    }
  };

  const handleEtaConfirm = (etaPayload) => {
    const order = etaOrder;
    setEtaOrder(null);
    if (order) acceptOrder(order.id, etaPayload);
  };

  const handleToggleAvailability = async (item) => {
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

  if (profileLoading) {
    return (
      <div className="loading-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (profileError || !profile) {
    return <ApplicationStatus />;
  }

  return (
    <div
      className="page-enter"
      style={{ padding: '24px 16px', maxWidth: 1100, margin: '0 auto' }}
    >
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 6,
          }}
        >
          <CookingPot size={28} weight="fill" color="var(--fire)" />
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.8rem',
              fontWeight: 800,
              color: 'var(--text-1)',
              margin: 0,
            }}
          >
            Кабинет сотрудника
          </h1>
          {newOrderAlert && (
            <button
              style={{
                background: '#22c55e',
                border: 'none',
                borderRadius: 'var(--r-sm)',
                padding: '4px 10px',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              onClick={() => setNewOrderAlert(false)}
            >
              <Bell size={12} weight="fill" />
              Новый заказ!
            </button>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <p
            style={{ color: 'var(--text-3)', fontSize: '0.875rem', margin: 0 }}
          >
            Роль:{' '}
            <strong style={{ color: 'var(--text-2)' }}>
              {translate(STAFF_ROLE_RU, profile.role, profile.role)}
            </strong>
          </p>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: '5px 10px',
              borderRadius: 'var(--r-sm)',
              border: `1px solid ${autoEta ? 'var(--fire)' : 'var(--border)'}`,
              background: autoEta ? 'var(--fire-subtle)' : 'var(--bg-card)',
              transition: 'all 0.15s',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={autoEta}
              onChange={(e) => {
                setAutoEta(e.target.checked);
                localStorage.setItem('staff_auto_eta', e.target.checked);
              }}
              style={{
                width: 14,
                height: 14,
                cursor: 'pointer',
                accentColor: 'var(--fire)',
              }}
            />
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: autoEta ? 'var(--fire)' : 'var(--text-2)',
                whiteSpace: 'nowrap',
              }}
            >
              Авто-время по блюдам
            </span>
          </label>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          borderBottom: '1px solid var(--border)',
          marginBottom: 20,
        }}
      >
        {[
          { id: 'orders', label: 'Заказы' },
          { id: 'menu', label: 'Стоп-лист' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom:
                activeTab === tab.id ? '2px solid var(--fire)' : 'none',
              color: activeTab === tab.id ? 'var(--text-1)' : 'var(--text-3)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <>
          {ordersLoading ? (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          ) : (
            <>
              {(() => {
                const criticalOrders = orders.filter(
                  (o) =>
                    o.status === 'ACCEPTED' &&
                    Math.floor((Date.now() - new Date(o.created_at)) / 60000) >=
                      15
                );
                return criticalOrders.length > 0 ? (
                  <div
                    style={{
                      padding: '10px 16px',
                      marginBottom: 12,
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid #ef4444',
                      borderRadius: 'var(--r-md)',
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    🔥 {criticalOrders.length}{' '}
                    {criticalOrders.length === 1
                      ? 'заказ задерживается'
                      : criticalOrders.length < 5
                        ? 'заказа задерживается'
                        : 'заказов задерживается'}{' '}
                    — проверьте принятые
                  </div>
                ) : null;
              })()}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 16,
                  alignItems: 'start',
                }}
              >
                {COLUMN_DEFS.map((col) => {
                  const colOrders = orders.filter((o) =>
                    col.statuses.includes(o.status)
                  );
                  return (
                    <KanbanColumn
                      key={col.id}
                      column={col}
                      orders={colOrders}
                      onAdvance={handleAdvance}
                      onCancel={handleCancelOrder}
                      updating={updating}
                      draggingId={draggingOrderId}
                      onDragStart={(order) => {
                        draggingOrderRef.current = order;
                        setDraggingOrderId(order.id);
                      }}
                      onDragEnd={() => {
                        setTimeout(() => {
                          draggingOrderRef.current = null;
                          setDraggingOrderId(null);
                        }, 0);
                      }}
                      onDrop={handleDrop}
                    />
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'menu' && (
        <div>
          {menuLoading ? (
            <div className="loading-center">
              <div className="spinner" />
            </div>
          ) : menuError ? (
            <div className="form-error">{menuError}</div>
          ) : menuItems.length === 0 ? (
            <EmptyState
              title="Меню пусто"
              subtitle="В этом ресторане пока нет блюд"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    opacity: item.is_available ? 1 : 0.6,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: 'var(--text-1)',
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}
                    >
                      {item.price} ₽
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: '1px solid var(--border)',
                      background: item.is_available
                        ? 'var(--fire-subtle)'
                        : 'var(--bg-raised)',
                      color: item.is_available
                        ? 'var(--fire)'
                        : 'var(--text-3)',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {item.is_available ? 'ВКЛ' : 'ВЫКЛ'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {etaOrder &&
        createPortal(
          <EtaModal
            order={etaOrder}
            onConfirm={handleEtaConfirm}
            onCancel={() => setEtaOrder(null)}
            updating={updating === etaOrder.id}
          />,
          document.body
        )}
    </div>
  );
};

export default StaffDashboardPage;
