import type { ReactNode } from 'react';
import { PackageIcon, ClockIcon, CheckCircleIcon, HandPalmIcon } from '@phosphor-icons/react';
import { orderStatusLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Order } from '@shared/types/models';
import styles from './adminTable.module.css';
import { formatPrice } from '@shared/utils/price';

interface StatusConfig {
  className: string;
  icon: ReactNode;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  PENDING: { className: 'pending', icon: <ClockIcon /> },
  ACCEPTED: { className: 'pending', icon: <CheckCircleIcon /> },
  READY: { className: 'ready', icon: <HandPalmIcon /> },
  COMPLETED: { className: 'ready', icon: <CheckCircleIcon weight="fill" /> },
};

const orderTitle = (order: Order): number => order.display_id;

interface AdminOrderCardProps {
  order: Order;
  onOpen: (order: Order) => void;
}

export function AdminOrderCard({ order, onOpen }: AdminOrderCardProps) {
  const { t } = useTranslation();
  const cfg = STATUS_MAP[order.status] ?? { className: 'pending', icon: <PackageIcon /> };
  return (
    <button
      type="button"
      className={styles['card']}
      onClick={() => { onOpen(order); }}
      style={{
        padding: 16,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ color: 'var(--text-3)', fontSize: "var(--text-sm)", fontWeight: 800 }}>
            {t('admin.orders.card.title', { displayId: orderTitle(order) })}
          </div>
          <div
            style={{
              color: 'var(--text-1)',
              fontWeight: 900,
              fontSize: "var(--text-md)",
              marginTop: 2,
            }}
          >
            {formatPrice(order.total_price)}
          </div>
        </div>
        <span className={`order-status-badge ${cfg.className}`}>
          {cfg.icon} {orderStatusLabel(order.status)}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          color: 'var(--text-3)',
          fontSize: "var(--text-base)",
        }}
      >
        <div>
          <b style={{ color: 'var(--text-2)' }}>{order.customer_name || t('admin.orders.card.customerFallback')}</b>
          {order.customer_phone && <span> · {order.customer_phone}</span>}
        </div>
        {(order.restaurant_name || order.restaurant_address) && (
          <div>
            {order.restaurant_name && (
              <b style={{ color: 'var(--text-2)' }}>{order.restaurant_name}</b>
            )}
            {order.restaurant_name && order.restaurant_address && <span> · </span>}
            {order.restaurant_address && <span>{order.restaurant_address}</span>}
          </div>
        )}
      </div>
    </button>
  );
}
