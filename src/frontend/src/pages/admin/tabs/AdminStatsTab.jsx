import { UsersThree, Package, Storefront } from '@phosphor-icons/react';
import {
  UsersByRoleChart,
  OrderStatusPieChart,
} from '../../../components/dashboard/DashboardCharts';

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  boxShadow: 'var(--shadow-sm)',
};

const sumValues = (valueMap = {}) =>
  Object.values(valueMap).reduce((a, b) => a + b, 0);

const Sparkline = ({ points = [], color = 'var(--fire)' }) => {
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
      <polyline points={area} fill="rgba(255, 107, 53, 0.1)" stroke="none" />
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

const StatCard = ({ label, value, icon, growth, onClick }) => {
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
              fontSize: '0.72rem',
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
              fontSize: '2rem',
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
        style={{ color: 'var(--text-3)', fontSize: '0.78rem', fontWeight: 700 }}
      >
        +{totalGrowth} за последние 14 дней
      </div>
    </button>
  );
};

export default function AdminStatsTab({ stats, ordersByStatusChartData, setActiveTab }) {
  if (!stats) return null;

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
          value={stats.total_users ?? sumValues(stats.users_by_permission)}
          icon={<UsersThree size={22} />}
          growth={stats.growth?.users}
          onClick={() => setActiveTab('users')}
        />
        <StatCard
          label="Рестораны"
          value={stats.total_restaurants || 0}
          icon={<Storefront size={22} />}
          growth={stats.growth?.restaurants}
          onClick={() => setActiveTab('restaurants')}
        />
        <StatCard
          label="Заказы"
          value={sumValues(stats.orders_by_status)}
          icon={<Package size={22} />}
          growth={stats.growth?.orders}
          onClick={() => setActiveTab('orders')}
        />
        <StatCard
          label="Вендоры"
          value={stats.total_vendors || 0}
          icon={<UsersThree size={22} />}
          growth={stats.growth?.vendors}
          onClick={() => setActiveTab('vendors')}
        />
      </div>

      {stats.users_by_role && (
        <div style={{ marginTop: 16 }}>
          <UsersByRoleChart data={stats.users_by_role} />
          {stats.orders_by_status && (
            <div
              style={{
                marginTop: 20,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 20,
              }}
            >
              <OrderStatusPieChart data={ordersByStatusChartData} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
