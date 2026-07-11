import { CaretRight } from '@phosphor-icons/react';
import type { Order, OrderStatus } from '@shared/types/models';

interface VendorOrderCardProps {
  order: Order;
  updatingOrderId: string | null;
  setSelectedOrder: (order: Order) => void;
  STATUS_LABEL_RU: Record<string, string>;
  nextOrderStatus: Partial<Record<OrderStatus, OrderStatus>>;
  getOrderDisplayId: (order: Order) => string | number;
  formatOrderTime: (value?: string | null) => string;
}

export function VendorOrderCard({
  order,
  updatingOrderId,
  setSelectedOrder,
  STATUS_LABEL_RU,
  nextOrderStatus,
  getOrderDisplayId,
  formatOrderTime,
}: VendorOrderCardProps) {
  return (
    <div
      className="order-card"
      style={{ cursor: 'pointer' }}
      onClick={() => setSelectedOrder(order)}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          Заказ #{getOrderDisplayId(order)}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
          {formatOrderTime(order.created_at) && (
            <>{formatOrderTime(order.created_at)} • </>
          )}
          {order.items?.length || 0} позиц. • {order.total_price} ₽
          {order.requested_pickup_at && (
            <> • к выдаче {formatOrderTime(order.requested_pickup_at)}</>
          )}
        </div>
        {order.items?.length > 0 && (
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              color: 'var(--text-2)',
              fontSize: '0.78rem',
            }}
          >
            {(order.items ?? []).map((item) => (
              <div key={item.id}>
                ×{item.quantity} {item.menu_item_name}
                {item.selected_options?.length > 0 && (
                  <span style={{ color: 'var(--text-3)' }}>
                    {' '}(
                    {item.selected_options
                      .map(
                        (option) =>
                          `${option.name}${option.price_delta ? ` +${option.price_delta} ₽` : ''}`
                      )
                      .join(', ')}
                    )
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
        }}
      >
        <span
          className={`order-status-badge ${
            order.status === 'PENDING'
              ? 'pending'
              : order.status === 'ACCEPTED'
                ? 'preparing'
                : 'ready'
          }`}
        >
          {STATUS_LABEL_RU[order.status] ?? order.status}
        </span>
        {nextOrderStatus[order.status] && (
          <button
            className="btn btn-secondary btn-sm"
            disabled={updatingOrderId === order.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(order);
            }}
          >
            Детали
            <CaretRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
