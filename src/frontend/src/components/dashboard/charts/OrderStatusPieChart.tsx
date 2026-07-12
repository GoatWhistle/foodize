import { memo } from 'react';
import { PieChart, Pie, Tooltip, Legend } from 'recharts';
import { ChartCard, COLORS, TOOLTIP_STYLE } from './chartPrimitives';

export const OrderStatusPieChart = memo(
  ({ data = {} }: { data?: Record<string, number> }) => {
    const chartData = Object.entries(data).map(([label, value], index) => ({
      label,
      value,
      fill: COLORS[index % COLORS.length],
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
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
        </PieChart>
      </ChartCard>
    );
  },
);
