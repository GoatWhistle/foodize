import { memo } from 'react';
import type { ReactElement } from 'react';
import type {
  AnalyticsPoint,
  FinanceSeriesPoint,
  FinanceAnalytics,
  FinanceTopItem,
  FinanceTopRestaurant,
} from '@shared/types/models';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

const TOOLTIP_STYLE = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
};

interface ChartCardProps {
  title: string;
  children: ReactElement;
}

const ChartCard = ({ title, children }: ChartCardProps) => (
  <div
    style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      padding: '20px',
    }}
  >
    <h3
      style={{
        fontSize: '0.95rem',
        fontWeight: 700,
        margin: '0 0 16px',
        color: 'var(--text-1)',
      }}
    >
      {title}
    </h3>
    <div style={{ height: 280, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

export const RevenueChart = memo(({ data }: { data: FinanceSeriesPoint[] }) => (
  <ChartCard title="Динамика выручки">
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="var(--fire)" stopOpacity={0.3} />
          <stop offset="95%" stopColor="var(--fire)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="var(--border)"
        vertical={false}
      />
      <XAxis
        dataKey="date"
        stroke="var(--text-3)"
        fontSize={11}
        tickFormatter={(val: string | number) =>
          new Date(val).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
          })
        }
      />
      <YAxis
        stroke="var(--text-3)"
        fontSize={11}
        tickFormatter={(val: string | number) => `${val}₽`}
      />
      <Tooltip
        contentStyle={TOOLTIP_STYLE}
        labelStyle={{ color: 'var(--text-1)', fontWeight: 700 }}
      />
      <Area
        type="monotone"
        dataKey="value"
        stroke="var(--fire)"
        fillOpacity={1}
        fill="url(#colorRevenue)"
        strokeWidth={2}
        name="Выручка"
      />
    </AreaChart>
  </ChartCard>
));

export const HourlyLoadChart = memo(({ data }: { data: AnalyticsPoint[] }) => (
  <ChartCard title="Нагрузка по часам">
    <BarChart data={data}>
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="var(--border)"
        vertical={false}
      />
      <XAxis dataKey="label" stroke="var(--text-3)" fontSize={11} />
      <YAxis stroke="var(--text-3)" fontSize={11} />
      <Tooltip
        contentStyle={TOOLTIP_STYLE}
      />
      <Bar
        dataKey="value"
        fill="var(--fire)"
        radius={[4, 4, 0, 0]}
        name="Заказы"
      />
    </BarChart>
  </ChartCard>
));

export const CategoryRevenueChart = memo(({ data }: { data: AnalyticsPoint[] }) => (
  <ChartCard title="Выручка по категориям">
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={5}
        dataKey="value"
        nameKey="label"
      >
        {data.map((_entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={TOOLTIP_STYLE}
      />
      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
    </PieChart>
  </ChartCard>
));

export const AOVDynamicsChart = memo(({ data }: { data: FinanceSeriesPoint[] }) => (
  <ChartCard title="Динамика среднего чека">
    <LineChart data={data}>
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="var(--border)"
        vertical={false}
      />
      <XAxis
        dataKey="date"
        stroke="var(--text-3)"
        fontSize={11}
        tickFormatter={(val: string | number) =>
          new Date(val).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
          })
        }
      />
      <YAxis
        stroke="var(--text-3)"
        fontSize={11}
        tickFormatter={(val: string | number) => `${val}₽`}
      />
      <Tooltip
        contentStyle={TOOLTIP_STYLE}
      />
      <Line
        type="monotone"
        dataKey="value"
        stroke="var(--chart-3)"
        strokeWidth={2}
        dot={{ r: 4 }}
        name="Средний чек"
      />
    </LineChart>
  </ChartCard>
));

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: 'var(--chart-5)',
  STAFF: 'var(--chart-3)',
  VENDOR: 'var(--chart-1)',
};

export const UsersByRoleChart = memo(({ data = {} }: { data?: Record<string, number> }) => {
  const roles = [
    { key: 'CUSTOMER', name: 'Клиенты' },
    { key: 'STAFF', name: 'Персонал' },
    { key: 'VENDOR', name: 'Вендоры' },
  ];
  const total = roles.reduce((s, r) => s + (data[r.key] || 0), 0) || 1;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
      }}
    >
      {roles.map(({ key, name }) => {
        const value = data[key] || 0;
        const pct = Math.round((value / total) * 100);
        const color = ROLE_COLORS[key];
        return (
          <div
            key={key}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {name}
            </div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color,
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
              {pct}% от всех
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: 'var(--border)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: color,
                  borderRadius: 3,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});

export const KPICards = memo(({ finance }: { finance: FinanceAnalytics }) => {
  const cancellationRate =
    finance.total_orders > 0
      ? ((finance.cancelled_orders / finance.total_orders) * 100).toFixed(1)
      : 0;

  const growth = finance.revenue_growth_pct;
  const growthColor =
    growth == null ? 'var(--text-3)' : growth >= 0 ? 'var(--color-success)' : 'var(--color-error)';
  const growthLabel =
    growth == null ? '—' : `${growth > 0 ? '+' : ''}${growth}%`;

  const cards = [
    {
      label: 'Выручка',
      value: `${(finance.total_revenue ?? 0).toLocaleString('ru-RU')} ₽`,
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}
    >
      {cards.map(({ label, value, color, sub, large }) => (
        <div
          key={label}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: large ? '1.55rem' : '1.2rem',
              fontWeight: 800,
              color: color ?? 'var(--text-1)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
              {sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

export const OrderStatusPieChart = memo(({ data = {} }: { data?: Record<string, number> }) => {
  if (!data) return null;
  const chartData = Object.entries(data).map(([label, value]) => ({
    label,
    value,
  }));
  return (
    <ChartCard title="Статусы заказов">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          nameKey="label"
        >
          {chartData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
      </PieChart>
    </ChartCard>
  );
});

export const TopItemsChart = memo(({ data = [] }: { data?: FinanceTopItem[] }) => {
  if (!Array.isArray(data)) return null;
  return (
    <ChartCard title="Топ 5 блюд">
      <BarChart
        data={data.slice(0, 5)}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          horizontal={false}
        />
        <XAxis type="number" stroke="var(--text-3)" fontSize={11} hide />
        <YAxis
          dataKey="name"
          type="category"
          stroke="var(--text-3)"
          fontSize={10}
          width={150}
          tick={{ fill: 'var(--text-1)', fontSize: 10 }}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [value, 'Продано шт.']}
        />
        <Bar
          dataKey="quantity"
          fill="var(--chart-3)"
          radius={[0, 4, 4, 0]}
          barSize={18}
        />
      </BarChart>
    </ChartCard>
  );
});

export const TopRestaurantsChart = memo(({ data = [] }: { data?: FinanceTopRestaurant[] }) => {
  if (!Array.isArray(data)) return null;
  return (
    <ChartCard title="Топ 5 ресторанов">
      <BarChart
        data={data.slice(0, 5)}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          horizontal={false}
        />
        <XAxis type="number" stroke="var(--text-3)" fontSize={11} hide />
        <YAxis
          dataKey="name"
          type="category"
          stroke="var(--text-3)"
          fontSize={10}
          width={150}
          tick={{ fill: 'var(--text-1)', fontSize: 10 }}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [`${String(value)} ₽`, 'Выручка']}
        />
        <Bar
          dataKey="revenue"
          fill="var(--fire)"
          radius={[0, 4, 4, 0]}
          barSize={18}
        />
      </BarChart>
    </ChartCard>
  );
});
