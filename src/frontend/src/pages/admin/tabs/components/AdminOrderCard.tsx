import type { ReactNode } from 'react';
import { PackageIcon, ClockIcon, CheckCircleIcon, HandPalmIcon } from '@phosphor-icons/react';
import { ORDER_STATUS_RU } from '@shared/utils/locales';
import type { Order } from '@shared/types/models';
import styles from './adminTable.module.css';

interface StatusConfig {
  label: string;
  className: string;
  icon: ReactNode;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  PENDING: { label: ORDER_STATUS_RU.PENDING, className: 'pending', icon: <ClockIcon /> },
  ACCEPTED: { label: ORDER_STATUS_RU.ACCEPTED, className: 'pending', icon: <CheckCircleIcon /> },
  READY: { label: ORDER_STATUS_RU.READY, className: 'ready', icon: <HandPalmIcon /> },
  COMPLETED: { label: ORDER_STATUS_RU.COMPLETED, className: 'ready', icon: <CheckCircleIcon weight="fill" /> },
};

const orderTitle = (order: Order): number => order.display_id;

interface AdminOrderCardProps {
  order: Order;
  onOpen: (order: Order) => void;
}

export function AdminOrderCard({ order, onOpen }: AdminOrderCardProps) {
  const cfg = STATUS_MAP[order.status] ?? {
    label: order.status,
    className: 'pending',
    icon: <PackageIcon />,
  };
  return (
    <button
      type="button"
      className={styles.card}
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
          <div style={{ color: 'var(--text-3)', fontSize: '0.74rem', fontWeight: 800 }}>
            Заказ #{orderTitle(order)}
          </div>
          <div
            style={{
              color: 'var(--text-1)',
              fontWeight: 900,
              fontSize: '1.05rem',
              marginTop: 2,
            }}
          >
            {order.total_price} ₽
          </div>
        </div>
        <span className={`order-status-badge ${cfg.className}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          color: 'var(--text-3)',
          fontSize: '0.84rem',
        }}
      >
        <div>
          <b style={{ color: 'var(--text-2)' }}>{order.customer_name || 'Клиент'}</b>
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
