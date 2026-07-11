import { memo } from 'react';
import type { AnalyticsPoint } from '@shared/types/models';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartCard, TOOLTIP_STYLE } from './chartPrimitives';

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
      <Tooltip contentStyle={TOOLTIP_STYLE} />
      <Bar
        dataKey="value"
        fill="var(--fire)"
        radius={[4, 4, 0, 0]}
        name="Заказы"
      />
    </BarChart>
  </ChartCard>
));
