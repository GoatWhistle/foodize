import type { ReactNode } from 'react';
import { UsersThreeIcon, PackageIcon, StorefrontIcon } from '@phosphor-icons/react';
import type { PlatformStats, Schemas } from '@shared/types/models';
import {
  UsersByRoleChart,
  OrderStatusPieChart,
} from '../../../components/dashboard/DashboardCharts';

type GrowthPoint = Schemas['StatsGrowthPoint'];

type PartialStats = Omit<PlatformStats, 'growth' | 'users_by_role' | 'orders_by_status'> & {
  growth?: Record<string, GrowthPoint[]>;
  users_by_role?: Record<string, number>;
  orders_by_status?: Record<string, number>;
};

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
};

const sumValues = (valueMap: Record<string, number> = {}): number =>
  Object.values(valueMap).reduce((a, b) => a + b, 0);

interface SparklineProps {
  points?: GrowthPoint[] | undefined;
  color?: string;
}

const Sparkline = ({ points = [], color = 'var(--fire)' }: SparklineProps) => {
  const values = points.map((point) => point.count || 0);
  const max = Math.max(...values, 1);
  const width = 220;
  const height = 76;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const line = values
    .map((value, index) => {
      const x = index * step;
      const y = height - 10 - (value / max) * (height - 20);
      return `${x},${y}`;
    })
    .join(' ');
  const area = line ? `0,${height} ${line} ${width},${height}` : '';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-hidden="true"
      style={{ width: '100%', height: 76, display: 'block', marginTop: 14 }}
    >
      <polyline points={area} fill="var(--accent-subtle)" stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((value, index) => {
        const x = index * step;
        const y = height - 10 - (value / max) * (height - 20);
        return (
          <circle key={`${index}-${value}`} cx={x} cy={y} r="3" fill={color} />
        );
      })}
    </svg>
  );
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  growth?: GrowthPoint[] | undefined;
  onClick: () => void;
}

const StatCard = ({ label, value, icon, growth, onClick }: StatCardProps) => {
  const totalGrowth = (growth || []).reduce(
    (sum, point) => sum + (point.count || 0),
    0
  );

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...cardStyle,
        padding: 18,
        textAlign: 'left',
        width: '100%',
        minHeight: 190,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
      >
        <div>
          <div
            style={{
              color: 'var(--text-3)',
              fontSize: "var(--text-sm)",
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </div>
          <div
            style={{
              color: 'var(--text-1)',
              fontSize: "var(--text-2xl)",
              fontWeight: 950,
              lineHeight: 1.1,
              marginTop: 8,
            }}
          >
            {value}
          </div>
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--r-sm)',
            background: 'var(--fire-subtle)',
            color: 'var(--fire)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
      <Sparkline points={growth} />
      <div
        style={{ color: 'var(--text-3)', fontSize: "var(--text-sm)", fontWeight: 700 }}
      >
        +{totalGrowth} за последние 14 дней
      </div>
    </button>
  );
};

export interface AdminStatsTabProps {
  stats: PlatformStats | null;
  ordersByStatusChartData: Record<string, number> | null;
  setActiveTab: (tab: string) => void;
}

export function AdminStatsTab({ stats, ordersByStatusChartData, setActiveTab }: AdminStatsTabProps) {
  if (!stats) return null;
  const s: PartialStats = stats;

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        <StatCard
          label="Пользователи"
          value={s.total_users}
          icon={<UsersThreeIcon size={22} />}
          growth={s.growth?.['users']}
          onClick={() => { setActiveTab('users'); }}
        />
        <StatCard
          label="Рестораны"
          value={s.total_restaurants || 0}
          icon={<StorefrontIcon size={22} />}
          growth={s.growth?.['restaurants']}
          onClick={() => { setActiveTab('restaurants'); }}
        />
        <StatCard
          label="Заказы"
          value={sumValues(s.orders_by_status)}
          icon={<PackageIcon size={22} />}
          growth={s.growth?.['orders']}
          onClick={() => { setActiveTab('orders'); }}
        />
        <StatCard
          label="Вендоры"
          value={s.total_vendors || 0}
          icon={<UsersThreeIcon size={22} />}
          growth={s.growth?.['vendors']}
          onClick={() => { setActiveTab('vendors'); }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <UsersByRoleChart data={s.users_by_role ?? {}} />
        <div
          style={{
            marginTop: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          <OrderStatusPieChart {...(ordersByStatusChartData ? { data: ordersByStatusChartData } : {})} />
        </div>
      </div>
    </>
  );
}
