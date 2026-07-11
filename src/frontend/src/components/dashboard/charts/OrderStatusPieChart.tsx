import { memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartCard, COLORS, TOOLTIP_STYLE } from './chartPrimitives';

export const OrderStatusPieChart = memo(
  ({ data = {} }: { data?: Record<string, number> }) => {
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
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${entry.label}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
        </PieChart>
      </ChartCard>
    );
  },
);
