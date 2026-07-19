import type { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';
import styles from './charts.module.css';

export const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

export const TOOLTIP_STYLE = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
};

export const TOOLTIP_LABEL_STYLE = {
  color: 'var(--text-1)',
  fontWeight: 700,
};

interface ChartCardProps {
  title: string;
  children: ReactElement;
}

export const ChartCard = ({ title, children }: ChartCardProps): ReactElement => (
  <div className={styles['card']}>
    <h3 className={styles['cardTitle']}>{title}</h3>
    <div className={styles['chartArea']}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);
