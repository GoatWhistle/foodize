import { ClockIcon } from '@phosphor-icons/react';

import { orderStatusLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';

import { formatDateTime } from './orderDetails.helpers';
import type { OrderStage } from './orderDetails.helpers';

export const OrderStagesList = ({ stages }: { stages: OrderStage[] }) => {
  const { t } = useTranslation();
  return (
  <div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 800,
        marginBottom: 10,
      }}
    >
      <ClockIcon size={18} color="var(--fire)" />
      {t('order.stages.title')}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {stages.map((stage) => (
        <div
          key={stage.status}
          style={{
            background:
              stage.state === 'current'
                ? 'var(--fire-subtle)'
                : 'var(--bg-surface)',
            border: `1px solid ${
              stage.state === 'current' ? 'var(--fire)' : 'var(--border)'
            }`,
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            opacity: stage.state === 'next' ? 0.62 : 1,
          }}
        >
          <div style={{ fontSize: "var(--text-base)", fontWeight: 800 }}>
            {orderStatusLabel(stage.status)}
            {stage.state === 'current' && (
              <span
                style={{
                  marginLeft: 8,
                  color: 'var(--fire)',
                  fontSize: "var(--text-sm)",
                }}
              >
                {t('order.stages.current')}
              </span>
            )}
          </div>
          <div
            style={{
              color: 'var(--text-3)',
              fontSize: "var(--text-sm)",
              whiteSpace: 'nowrap',
            }}
          >
            {stage.at ? formatDateTime(stage.at) : t('common.states.dash')}
          </div>
        </div>
      ))}
    </div>
  </div>
  );
};
