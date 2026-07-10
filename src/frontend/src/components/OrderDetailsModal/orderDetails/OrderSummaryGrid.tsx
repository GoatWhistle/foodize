import type { Order } from '@shared/types/models';

import { STATUS_LABEL_RU, formatDateTime } from './orderDetails.helpers';

export const OrderSummaryGrid = ({ order }: { order: Order }) => (
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
      <div style={{ color: 'var(--text-3)', fontSize: '0.72rem', marginBottom: 6 }}>
        Статус
      </div>
      <div style={{ fontWeight: 800 }}>
        {STATUS_LABEL_RU[order.status] ?? order.status}
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
      <div style={{ color: 'var(--text-3)', fontSize: '0.72rem', marginBottom: 6 }}>
        Создан
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
      <div style={{ color: 'var(--text-3)', fontSize: '0.72rem', marginBottom: 6 }}>
        К выдаче
      </div>
      <div style={{ fontWeight: 800 }}>
        {order.requested_pickup_at
          ? formatDateTime(order.requested_pickup_at)
          : 'Как можно скорее'}
      </div>
    </div>
  </div>
);
