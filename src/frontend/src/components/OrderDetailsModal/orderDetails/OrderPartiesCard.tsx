import { UserCircleIcon, StorefrontIcon } from '@phosphor-icons/react';
import type { Order } from '@shared/types/models';

import { useTranslation } from '@shared/i18n/useTranslation';

import { formatDateTime } from './orderDetails.helpers';

export const OrderPartiesCard = ({ order }: { order: Order }) => {
  const { t } = useTranslation();
  return (
  <div
    style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <UserCircleIcon size={18} color="var(--fire)" />
      <span style={{ fontWeight: 800 }}>{t('order.details.customer')}</span>
    </div>
    {order.customer_name && (
      <div style={{ fontWeight: 800, fontSize: "var(--text-base)" }}>
        {order.customer_name}
      </div>
    )}

    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <StorefrontIcon size={18} color="var(--fire)" />
      <span style={{ fontWeight: 800 }}>{t('order.details.venue')}</span>
    </div>
    {order.restaurant_name && (
      <div style={{ fontWeight: 800, fontSize: "var(--text-base)" }}>
        {order.restaurant_name}
      </div>
    )}
    {order.restaurant_address && (
      <div style={{ color: 'var(--text-2)', fontSize: "var(--text-base)" }}>
        {order.restaurant_address}
      </div>
    )}

    {order.estimated_ready_at && (
      <div style={{ color: 'var(--text-3)', fontSize: "var(--text-base)" }}>
        {t('order.details.expectedBy', { time: formatDateTime(order.estimated_ready_at) })}
      </div>
    )}
    {order.ready_at && (
      <div style={{ color: 'var(--text-3)', fontSize: "var(--text-base)" }}>
        {t('order.details.readyAt', { time: formatDateTime(order.ready_at) })}
      </div>
    )}
  </div>
  );
};
