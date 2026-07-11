import { memo } from 'react';
import type { FinanceSeriesPoint } from '@shared/types/models';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartCard, TOOLTIP_STYLE } from './chartPrimitives';

export const AOVDynamicsChart = memo(
  ({ data }: { data: FinanceSeriesPoint[] }) => (
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
        <Tooltip contentStyle={TOOLTIP_STYLE} />
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
  ),
);
