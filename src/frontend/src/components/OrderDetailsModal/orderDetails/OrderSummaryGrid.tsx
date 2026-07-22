import type { Order } from '@shared/types/models';

import { orderStatusLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';

import { formatDateTime } from './orderDetails.helpers';

export const OrderSummaryGrid = ({ order }: { order: Order }) => {
  const { t } = useTranslation();
  return (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
    }}
  >
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 12,
      }}
    >
      <div style={{ color: 'var(--text-3)', fontSize: "var(--text-sm)", marginBottom: 6 }}>
        {t('common.labels.status')}
      </div>
      <div style={{ fontWeight: 800 }}>
        {orderStatusLabel(order.status)}
      </div>
    </div>
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 12,
      }}
    >
      <div style={{ color: 'var(--text-3)', fontSize: "var(--text-sm)", marginBottom: 6 }}>
        {t('order.details.createdAt')}
      </div>
      <div style={{ fontWeight: 800 }}>{formatDateTime(order.created_at)}</div>
    </div>
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: 12,
      }}
    >
      <div style={{ color: 'var(--text-3)', fontSize: "var(--text-sm)", marginBottom: 6 }}>
        {t('order.details.pickupTarget')}
      </div>
      <div style={{ fontWeight: 800 }}>
        {order.requested_pickup_at
          ? formatDateTime(order.requested_pickup_at)
          : t('order.details.asap')}
      </div>
    </div>
  </div>
  );
};
