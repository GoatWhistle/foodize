import { memo } from 'react';
import type { FinanceAnalytics } from '@shared/types/models';
import styles from './charts.module.css';

export const KPICards = memo(({ finance }: { finance: FinanceAnalytics }) => {
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
    growth == null ? '—' : `${growth > 0 ? '+' : ''}${growth}%`;

  const cards = [
    {
      label: 'Выручка',
      value: `${finance.total_revenue.toLocaleString('ru-RU')} ₽`,
      color: 'var(--fire)',
      large: true,
    },
    {
      label: 'Рост',
      value: growthLabel,
      color: growthColor,
      sub: 'vs. прошлый период',
    },
    { label: 'Заказов', value: finance.total_orders },
    { label: 'Средний чек', value: `${finance.average_check} ₽` },
    { label: 'Конверсия', value: `${finance.conversion_percent}%` },
    {
      label: 'Отменено',
      value: finance.cancelled_orders,
      sub: `${cancellationRate}% от всех`,
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
