import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/useOrderStore';
import OrderStatusBadge from '../../components/ui/OrderStatusBadge';
import { ROUTES } from '../../constants/routes';
import { orderService } from '../../services/orderService';
import { useModalStore } from '../../store/useModalStore';
import { createOrderWebSocket } from '../../services/api';
import { ORDER_STATUS_RU } from '../../utils/locales';

const STATUS_LABEL_RU = ORDER_STATUS_RU;

const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED']);
const STATUS_FLOW = ['PENDING', 'ACCEPTED', 'COOKING', 'READY', 'COMPLETED'];

const getOrderDisplayId = (order) => order.display_id ?? order.id.slice(0, 8);

const extractEvents = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const getOrderStages = (order, events) => {
  const eventByStatus = new Map(
    (events || []).map((event) => [event.new_status, event])
  );
  const currentIndex = STATUS_FLOW.indexOf(order.status);

  if (order.status === 'CANCELLED') {
    return [
      ...STATUS_FLOW.slice(0, Math.max(currentIndex, 0) + 1),
      'CANCELLED',
    ].map((status) => ({
      status,
      at:
        status === 'PENDING'
          ? order.created_at
          : eventByStatus.get(status)?.created_at,
      state: status === 'CANCELLED' ? 'current' : 'done',
    }));
  }

  return STATUS_FLOW.map((status, index) => ({
    status,
    at:
      status === 'PENDING'
        ? order.created_at
        : eventByStatus.get(status)?.created_at,
    state:
      index < currentIndex
        ? 'done'
        : index === currentIndex
          ? 'current'
          : 'next',
  }));
};

import { useShallow } from 'zustand/react/shallow';

const OrderStatusPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const requestConfirm = useModalStore((s) => s.requestConfirm);
  const { fetchOrder, currentOrder } = useOrderStore(
    useShallow((s) => ({
      fetchOrder: s.fetchOrder,
      currentOrder: s.currentOrder,
    }))
  );
  const wsRef = useRef(null);
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [events, setEvents] = useState([]);
  const [cancelError, setCancelError] = useState('');
  const [completeError, setCompleteError] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      const res = await orderService.getOrderEvents(id);
      setEvents(extractEvents(res));
    } catch {}
  }, [id]);

  useEffect(() => {
    fetchOrder(id);
    loadEvents();

    wsRef.current = createOrderWebSocket(
      id,
      (data) => {
        if (data.error) return;
        useOrderStore.setState({ currentOrder: data });
        loadEvents();
      },
      () => {
        if (
          !TERMINAL_STATUSES.has(useOrderStore.getState().currentOrder?.status)
        ) {
          fetchOrder(id);
        }
      }
    );

    return () => wsRef.current?.close();
  }, [id, fetchOrder, loadEvents]);

  if (!currentOrder) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  const isReady =
    currentOrder.status === 'READY' || currentOrder.status === 'COMPLETED';
  const isCancelled = currentOrder.status === 'CANCELLED';
  const isPending = currentOrder.status === 'PENDING';
  const stages = getOrderStages(currentOrder, events);

  const handleCancel = async () => {
    requestConfirm({
      title: 'Отменить заказ?',
      message:
        'Вы уверены, что хотите отменить этот заказ? Это действие необратимо.',
      confirmLabel: 'Отменить заказ',
      danger: true,
      onConfirm: async () => {
        setCancelling(true);
        setCancelError('');
        try {
          await orderService.cancelOrder(id);
          await fetchOrder(id);
        } catch {
          setCancelError('Не удалось отменить заказ');
        } finally {
          setCancelling(false);
        }
      },
    });
  };

  const handleComplete = async () => {
    setCompleting(true);
    setCompleteError('');
    try {
      await orderService.completeOrder(id);
      await fetchOrder(id);
    } catch {
      setCompleteError('Не удалось подтвердить получение');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div
      className={`status-screen page-enter${isReady ? ' status-ready-flash' : ''}`}
    >
      <OrderStatusBadge
        status={currentOrder.status}
        progress={isCancelled ? 0 : 0.6}
      />

      <div
        style={{
          marginTop: 18,
          fontWeight: 800,
          color: 'var(--text-2)',
        }}
      >
        Заказ #{getOrderDisplayId(currentOrder)}
      </div>

      <div
        style={{
          marginTop: 40,
          width: '100%',
          maxWidth: 380,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            marginBottom: 14,
          }}
        >
          Состав заказа
        </div>

        {Array.isArray(currentOrder.items) &&
          currentOrder.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
                fontSize: '0.9rem',
              }}
            >
              <span style={{ fontWeight: 600, marginRight: 8 }}>
                ×{item.quantity}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-1)', fontWeight: 500 }}>
                  {item.menu_item_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                  {item.menu_item_category}
                </div>
                {item.selected_options?.length > 0 && (
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: '0.72rem',
                      color: 'var(--text-3)',
                      lineHeight: 1.35,
                    }}
                  >
                    {item.selected_options
                      .map(
                        (option) =>
                          `${option.name}${
                            option.price_delta
                              ? ` +${option.price_delta} ₽`
                              : ''
                          }`
                      )
                      .join(', ')}
                  </div>
                )}
              </div>
              <span style={{ fontWeight: 700 }}>
                {item.price_at_purchase} ₽
              </span>
            </div>
          ))}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 14,
            fontWeight: 800,
            fontSize: '1.1rem',
            letterSpacing: '-0.02em',
          }}
        >
          <span>Итого</span>
          <span style={{ color: 'var(--fire)' }}>
            {currentOrder.total_price} ₽
          </span>
        </div>

        {currentOrder.estimated_ready_at && !isReady && !isCancelled && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              fontSize: '0.85rem',
              color: 'var(--text-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--fire)' }}>
              Ожидаем к
            </span>
            {new Date(currentOrder.estimated_ready_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}

        {currentOrder.ready_at && isReady && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              fontSize: '0.85rem',
              color: 'var(--text-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--fire)' }}>
              Готов в
            </span>
            {new Date(currentOrder.ready_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          width: '100%',
          maxWidth: 380,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            marginBottom: 14,
          }}
        >
          Этапы заказа
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stages.map((stage, i) => (
            <div key={stage.status} style={{ display: 'flex', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  className={`order-stage-dot order-stage-dot--${stage.state}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background:
                      stage.state === 'current'
                        ? 'var(--fire)'
                        : stage.state === 'done'
                          ? 'var(--color-success)'
                          : 'var(--border)',
                  }}
                />
                {i !== stages.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      background: 'var(--border)',
                      marginTop: 4,
                      minHeight: 20,
                    }}
                  />
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color:
                      stage.state === 'next'
                        ? 'var(--text-3)'
                        : 'var(--text-1)',
                  }}
                >
                  {STATUS_LABEL_RU[stage.status] ?? stage.status}
                  {stage.state === 'current' && (
                    <span style={{ color: 'var(--fire)', marginLeft: 8 }}>
                      сейчас
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                  {stage.at
                    ? new Date(stage.at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'ожидается'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(cancelError || completeError) && (
        <div
          className="form-error"
          style={{ marginTop: 16, maxWidth: 380, width: '100%' }}
        >
          {cancelError || completeError}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginTop: 12,
          width: '100%',
          maxWidth: 380,
        }}
      >
        {isPending && (
          <button
            className="btn btn-secondary"
            style={{ flex: 1, color: 'var(--error)' }}
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? 'Отмена...' : 'Отменить'}
          </button>
        )}
        {currentOrder.status === 'READY' && (
          <button
            className="btn btn-primary"
            style={{
              flex: 1,
              background: 'var(--color-success)',
              borderColor: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            onClick={handleComplete}
            disabled={completing}
            id="complete-order-btn"
          >
            {completing ? 'Подтверждение...' : '✓ Получил'}
          </button>
        )}
        {['COMPLETED', 'CANCELLED'].includes(currentOrder.status) && (
          <button
            className="btn btn-primary"
            style={{ flex: 1, background: 'var(--fire)' }}
            onClick={async () => {
              const repeat = useOrderStore.getState().repeatOrder;
              await repeat(currentOrder);
              navigate(
                ROUTES.RESTAURANT.replace(':id', currentOrder.restaurant_id)
              );
            }}
          >
            Повторить заказ
          </button>
        )}
        <button
          className="btn btn-secondary"
          style={{ flex: 2 }}
          onClick={() => navigate(ROUTES.ORDERS)}
          id="back-to-orders-btn"
        >
          ← Закрыть
        </button>
      </div>
    </div>
  );
};

export default OrderStatusPage;
