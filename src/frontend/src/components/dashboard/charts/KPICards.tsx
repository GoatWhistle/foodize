import { memo } from 'react';
import type { FinanceAnalytics } from '@shared/types/models';
import styles from './charts.module.css';
import { useTranslation } from '@shared/i18n/useTranslation';


export const KPICards = memo(({ finance }: { finance: FinanceAnalytics }) => {
  const { t } = useTranslation();
  const cancellationRate =
    finance.total_orders > 0
      ? ((finance.cancelled_orders / finance.total_orders) * 100).toFixed(1)
      : 0;

  const growth = finance.revenue_growth_pct;
  const growthColor =
    growth == null
      ? 'var(--text-3)'
      : growth >= 0
        ? 'var(--color-success)'
        : 'var(--color-error)';
  const growthLabel =
    growth == null ? t('common.states.dash') : `${growth > 0 ? '+' : ''}${growth}%`;

  const cards = [
    {
      label: t('admin.charts.kpi.revenue'),
      value: `${finance.total_revenue.toLocaleString('ru-RU')} ₽`,
      color: 'var(--fire)',
      large: true,
    },
    {
      label: t('admin.charts.kpi.growth'),
      value: growthLabel,
      color: growthColor,
      sub: t('admin.charts.kpi.growthSub'),
    },
    { label: t('admin.charts.kpi.orders'), value: finance.total_orders },
    { label: t('admin.charts.kpi.averageCheck'), value: t('admin.charts.kpi.averageCheckValue', { value: finance.average_check }) },
    { label: t('admin.charts.kpi.conversion'), value: t('admin.charts.kpi.conversionValue', { value: finance.conversion_percent }) },
    {
      label: t('admin.charts.kpi.cancelled'),
      value: finance.cancelled_orders,
      sub: t('admin.charts.kpi.cancelledSub', { percent: cancellationRate }),
      color: finance.cancelled_orders > 0 ? 'var(--color-error)' : undefined,
    },
  ];

  return (
    <div className={styles['kpiGrid']}>
      {cards.map(({ label, value, color, sub, large }) => (
        <div key={label} className={styles['kpiCard']}>
          <div className={styles['kpiLabel']}>{label}</div>
          <div
            className={large ? `${styles['kpiValue']} ${styles['kpiValueLarge']}` : styles['kpiValue']}
            style={{ color: color ?? 'var(--text-1)' }}
          >
            {value}
          </div>
          {sub && <div className={styles['kpiSub']}>{sub}</div>}
        </div>
      ))}
    </div>
  );
});
