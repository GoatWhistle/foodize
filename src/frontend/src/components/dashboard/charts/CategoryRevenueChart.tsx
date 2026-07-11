import { memo } from 'react';
import type { AnalyticsPoint } from '@shared/types/models';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartCard, COLORS, TOOLTIP_STYLE } from './chartPrimitives';

export const CategoryRevenueChart = memo(
  ({ data }: { data: AnalyticsPoint[] }) => (
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
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ChartCard>
  ),
);
