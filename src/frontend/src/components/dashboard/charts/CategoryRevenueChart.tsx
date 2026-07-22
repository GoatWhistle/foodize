import { memo } from 'react';
import type { AnalyticsPoint } from '@shared/types/models';
import { PieChart, Pie, Tooltip, Legend } from 'recharts';
import { ChartCard, COLORS, TOOLTIP_STYLE } from './chartPrimitives';
import { useTranslation } from '@shared/i18n/useTranslation';


export const CategoryRevenueChart = memo(
  ({ data }: { data: AnalyticsPoint[] }) => {
    const { t } = useTranslation();
    return (
    <ChartCard title={t('admin.charts.categoryRevenue.title')}>
      <PieChart>
        <Pie
          data={data.map((entry, index) => ({
            ...entry,
            fill: COLORS[index % COLORS.length],
          }))}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          nameKey="label"
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ChartCard>
    );
  },
);
