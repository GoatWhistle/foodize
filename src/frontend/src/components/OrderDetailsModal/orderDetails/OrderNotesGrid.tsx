import type { Order } from '@shared/types/models';

export const OrderNotesGrid = ({ order }: { order: Order }) => (
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
      <div style={{ color: 'var(--text-3)', fontSize: '0.72rem' }}>
        Комментарий
      </div>
      <div style={{ marginTop: 6, fontSize: '0.84rem' }}>
        {order.comment || 'Не указан'}
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
      <div style={{ color: 'var(--text-3)', fontSize: '0.72rem' }}>Промокод</div>
      <div style={{ marginTop: 6, fontSize: '0.84rem' }}>
        {(order as Order & { promo_code?: string | null }).promo_code ||
          'Не сохранен'}
      </div>
    </div>
  </div>
);
