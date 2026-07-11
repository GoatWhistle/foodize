import { memo } from 'react';
import type { FinanceTopRestaurant } from '@shared/types/models';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartCard, TOOLTIP_STYLE } from './chartPrimitives';

export const TopRestaurantsChart = memo(
  ({ data = [] }: { data?: FinanceTopRestaurant[] }) => {
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
  },
);
