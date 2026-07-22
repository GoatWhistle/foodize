import { memo } from 'react';
import type { FinanceSeriesPoint } from '@shared/types/models';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartCard, TOOLTIP_STYLE, TOOLTIP_LABEL_STYLE } from './chartPrimitives';
import { useTranslation } from '@shared/i18n/useTranslation';


export const RevenueChart = memo(({ data }: { data: FinanceSeriesPoint[] }) => {
  const { t } = useTranslation();
  return (
  <ChartCard title={t('admin.charts.revenue.title')}>
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
      <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
      <Area
        type="monotone"
        dataKey="value"
        stroke="var(--fire)"
        fillOpacity={1}
        fill="url(#colorRevenue)"
        strokeWidth={2}
        name={t('admin.charts.revenue.series')}
      />
    </AreaChart>
  </ChartCard>
  );
});
