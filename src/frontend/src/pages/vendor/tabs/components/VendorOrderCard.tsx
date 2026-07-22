import { CaretRightIcon } from '@phosphor-icons/react';
import type { Order, OrderStatus } from '@shared/types/models';
import { formatPrice, formatOptionsSummary } from '@shared/utils/price';
import { orderStatusLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';

interface VendorOrderCardProps {
  order: Order;
  updatingOrderId: string | null;
  setSelectedOrder: (order: Order) => void;
  nextOrderStatus: Partial<Record<OrderStatus, OrderStatus>>;
  getOrderDisplayId: (order: Order) => string | number;
  formatOrderTime: (value?: string | null) => string;
}

export function VendorOrderCard({
  order,
  updatingOrderId,
  setSelectedOrder,
  nextOrderStatus,
  getOrderDisplayId,
  formatOrderTime,
}: VendorOrderCardProps) {
  const { t } = useTranslation();
  return (
    <div
      className="order-card"
      style={{ cursor: 'pointer' }}
      onClick={() => { setSelectedOrder(order); }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          {t('vendor.orders.card.title', { displayId: getOrderDisplayId(order) })}
        </div>
        <div style={{ fontSize: "var(--text-base)", color: 'var(--text-3)' }}>
          {formatOrderTime(order.created_at) && (
            <>{formatOrderTime(order.created_at)} • </>
          )}
          {t('vendor.orders.card.itemsAndTotal', { count: order.items.length || 0, total: formatPrice(order.total_price) })}
          {order.requested_pickup_at && (
            <>{t('vendor.orders.card.pickupAt', { time: formatOrderTime(order.requested_pickup_at) })}</>
          )}
        </div>
        {order.items.length > 0 && (
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              color: 'var(--text-2)',
              fontSize: "var(--text-sm)",
            }}
          >
            {order.items.map((item) => (
              <div key={item.id}>
                ×{item.quantity} {item.menu_item_name}
                {item.selected_options.length > 0 && (
                  <span style={{ color: 'var(--text-3)' }}>
                    {' '}(
                    {formatOptionsSummary(item.selected_options)}
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
          {orderStatusLabel(order.status)}
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
            {t('common.actions.details')}
            <CaretRightIcon size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
