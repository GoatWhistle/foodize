import { TagIcon, TrashIcon } from '@phosphor-icons/react';
import { CATEGORY_RU } from '@shared/utils/locales';
import type { Promo } from '@shared/types/models';
import styles from './VendorPromos.module.css';

interface PromoCardProps {
  promo: Promo;
  deactivating: boolean;
  onDeactivate: (code: string) => void;
}

const getPromoConditionLabels = (promo: Promo): string[] => {
  const labels: string[] = [];
  if (promo.first_order_only) labels.push('только первый заказ');
  if (promo.min_order_amount) labels.push(`от ${promo.min_order_amount} ₽`);
  if (promo.menu_category) {
    const categoryLabels = CATEGORY_RU as Record<string, string>;
    labels.push(categoryLabels[promo.menu_category] || promo.menu_category);
  }
  return labels;
};

export function PromoCard({ promo, deactivating, onDeactivate }: PromoCardProps) {
  const conditionLabels = getPromoConditionLabels(promo);
  return (
    <div
      className={styles.card}
      style={{
        border: `1px solid ${promo.is_active ? 'var(--border)' : 'var(--border-faint, var(--border))'}`,
        opacity: promo.is_active ? 1 : 0.5,
      }}
    >
      <TagIcon size={18} weight="bold" color={promo.is_active ? 'var(--fire)' : 'var(--text-3)'} />
      <div className={styles.cardBody}>
        <div className={styles.cardCode}>{promo.code}</div>
        <div className={styles.cardMeta}>
          {promo.discount_type === 'PERCENT'
            ? `${promo.discount_value}%`
            : `${promo.discount_value} ₽`}
          {' • '}
          {promo.used_count}/{promo.max_uses ?? '∞'} исп.
          {promo.expires_at
            ? ` • до ${new Date(promo.expires_at).toLocaleDateString()}`
            : ''}
        </div>
        {conditionLabels.length > 0 && (
          <div className={styles.cardConditions}>
            Условия: {conditionLabels.join(' • ')}
          </div>
        )}
      </div>
      <span
        className={styles.badge}
        style={{
          background: promo.is_active ? 'var(--color-success-bg)' : 'var(--color-neutral-bg)',
          color: promo.is_active ? 'var(--color-success-dim)' : 'var(--color-neutral)',
          border: `1px solid ${promo.is_active ? 'var(--color-success-border)' : 'var(--color-neutral-border)'}`,
        }}
      >
        {promo.is_active ? 'Активен' : 'Завершён'}
      </span>
      {promo.is_active && (
        <button
          className="btn-icon-sm danger"
          disabled={deactivating}
          onClick={() => { onDeactivate(promo.code); }}
          title="Деактивировать"
        >
          <TrashIcon size={14} />
        </button>
      )}
    </div>
  );
}
