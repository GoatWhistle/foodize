import { memo } from 'react';
import type { FinanceTopItem } from '@shared/types/models';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartCard, TOOLTIP_STYLE } from './chartPrimitives';

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
