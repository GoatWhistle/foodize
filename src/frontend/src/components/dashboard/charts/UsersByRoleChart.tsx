import { memo } from 'react';
import styles from './charts.module.css';
import { useTranslation } from '@shared/i18n/useTranslation';


const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: 'var(--chart-5)',
  STAFF: 'var(--chart-3)',
  VENDOR: 'var(--chart-1)',
};

const ROLES = [
  { key: 'CUSTOMER', nameKey: 'admin.charts.usersByRole.customer' },
  { key: 'STAFF', nameKey: 'admin.charts.usersByRole.staff' },
  { key: 'VENDOR', nameKey: 'admin.charts.usersByRole.vendor' },
];

export const UsersByRoleChart = memo(
  ({ data = {} }: { data?: Record<string, number> }) => {
    const { t } = useTranslation();
    const total = ROLES.reduce((sum, role) => sum + (data[role.key] || 0), 0) || 1;

    return (
      <div className={styles['roleGrid']}>
        {ROLES.map(({ key, nameKey }) => {
          const value = data[key] || 0;
          const pct = Math.round((value / total) * 100);
          const color = ROLE_COLORS[key];
          return (
            <div key={key} className={styles['roleCard']}>
              <div className={styles['roleLabel']}>{t(nameKey)}</div>
              <div className={styles['roleValue']} style={{ color }}>
                {value}
              </div>
              <div className={styles['rolePct']}>{t('admin.charts.usersByRole.percentOfAll', { percent: pct })}</div>
              <div className={styles['roleBar']}>
                <div
                  className={styles['roleBarFill']}
                  style={{
                    width: '100%',
                    transform: `scaleX(${pct / 100})`,
                    background: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);
