import { TagIcon, TrashIcon } from '@phosphor-icons/react';
import { categoryLabel } from '@shared/utils/locales';
import { t, useTranslation } from '@shared/i18n/useTranslation';
import { formatPrice } from '@shared/utils/price';
import type { Promo } from '@shared/types/models';
import styles from './VendorPromos.module.css';

interface PromoCardProps {
  promo: Promo;
  deactivating: boolean;
  onDeactivate: (code: string) => void;
}

const getPromoConditionLabels = (promo: Promo): string[] => {
  const labels: string[] = [];
  if (promo.first_order_only) labels.push(t('vendor.promos.card.firstOrderOnly'));
  if (promo.min_order_amount) labels.push(t('vendor.promos.card.minAmount', { amount: formatPrice(promo.min_order_amount) }));
  if (promo.menu_category) labels.push(categoryLabel(promo.menu_category));
  return labels;
};

export function PromoCard({ promo, deactivating, onDeactivate }: PromoCardProps) {
  const { t: translate } = useTranslation();
  const conditionLabels = getPromoConditionLabels(promo);
  return (
    <div
      className={styles['card']}
      style={{
        border: `1px solid ${promo.is_active ? 'var(--border)' : 'var(--border-faint, var(--border))'}`,
        opacity: promo.is_active ? 1 : 0.5,
      }}
    >
      <TagIcon size={18} weight="bold" color={promo.is_active ? 'var(--fire)' : 'var(--text-3)'} />
      <div className={styles['cardBody']}>
        <div className={styles['cardCode']}>{promo.code}</div>
        <div className={styles['cardMeta']}>
          {promo.discount_type === 'PERCENT'
            ? `${promo.discount_value}%`
            : formatPrice(promo.discount_value)}
          {' • '}
          {translate('vendor.promos.card.usage', { used: promo.used_count, max: promo.max_uses ?? translate('vendor.promos.card.unlimited') })}
          {promo.expires_at
            ? translate('vendor.promos.card.expires', { date: new Date(promo.expires_at).toLocaleDateString() })
            : ''}
        </div>
        {conditionLabels.length > 0 && (
          <div className={styles['cardConditions']}>
            {translate('vendor.promos.card.conditions', { conditions: conditionLabels.join(' • ') })}
          </div>
        )}
      </div>
      <span
        className={styles['badge']}
        style={{
          background: promo.is_active ? 'var(--color-success-bg)' : 'var(--color-neutral-bg)',
          color: promo.is_active ? 'var(--color-success-dim)' : 'var(--color-neutral)',
          border: `1px solid ${promo.is_active ? 'var(--color-success-border)' : 'var(--color-neutral-border)'}`,
        }}
      >
        {promo.is_active ? translate('vendor.promos.card.active') : translate('vendor.promos.card.finished')}
      </span>
      {promo.is_active && (
        <button
          className="btn-icon-sm danger"
          disabled={deactivating}
          onClick={() => { onDeactivate(promo.code); }}
          title={translate('vendor.promos.card.deactivate')}
        >
          <TrashIcon size={14} />
        </button>
      )}
    </div>
  );
}
