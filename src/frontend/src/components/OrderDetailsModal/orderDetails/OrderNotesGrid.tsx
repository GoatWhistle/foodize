import { useTranslation } from '@shared/i18n/useTranslation';
import type { Order } from '@shared/types/models';

export const OrderNotesGrid = ({ order }: { order: Order }) => {
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
      <div style={{ color: 'var(--text-3)', fontSize: "var(--text-sm)" }}>
        {t('order.details.comment')}
      </div>
      <div style={{ marginTop: 6, fontSize: "var(--text-base)" }}>
        {order.comment || t('order.details.commentEmpty')}
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
      <div style={{ color: 'var(--text-3)', fontSize: "var(--text-sm)" }}>{t('order.details.promoCode')}</div>
      <div style={{ marginTop: 6, fontSize: "var(--text-base)" }}>
        {(order as Order & { promo_code?: string | null }).promo_code ||
          t('order.details.promoEmpty')}
      </div>
    </div>
  </div>
  );
};
