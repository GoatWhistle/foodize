import { memo } from 'react';
import styles from './charts.module.css';

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: 'var(--chart-5)',
  STAFF: 'var(--chart-3)',
  VENDOR: 'var(--chart-1)',
};

const ROLES = [
  { key: 'CUSTOMER', name: 'Клиенты' },
  { key: 'STAFF', name: 'Персонал' },
  { key: 'VENDOR', name: 'Вендоры' },
];

export const UsersByRoleChart = memo(
  ({ data = {} }: { data?: Record<string, number> }) => {
    const total = ROLES.reduce((sum, role) => sum + (data[role.key] || 0), 0) || 1;

    return (
      <div className={styles.roleGrid}>
        {ROLES.map(({ key, name }) => {
          const value = data[key] || 0;
          const pct = Math.round((value / total) * 100);
          const color = ROLE_COLORS[key];
          return (
            <div key={key} className={styles.roleCard}>
              <div className={styles.roleLabel}>{name}</div>
              <div className={styles.roleValue} style={{ color }}>
                {value}
              </div>
              <div className={styles.rolePct}>{pct}% от всех</div>
              <div className={styles.roleBar}>
                <div
                  className={styles.roleBarFill}
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
