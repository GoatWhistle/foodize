import { Clock } from '@phosphor-icons/react';

import { STATUS_LABEL_RU, formatDateTime } from './orderDetails.helpers';
import type { OrderStage } from './orderDetails.helpers';

export const OrderStagesList = ({ stages }: { stages: OrderStage[] }) => (
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
      <Clock size={18} color="var(--fire)" />
      Этапы заказа
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
          <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>
            {STATUS_LABEL_RU[stage.status] ?? stage.status}
            {stage.state === 'current' && (
              <span
                style={{
                  marginLeft: 8,
                  color: 'var(--fire)',
                  fontSize: '0.72rem',
                }}
              >
                текущий
              </span>
            )}
          </div>
          <div
            style={{
              color: 'var(--text-3)',
              fontSize: '0.72rem',
              whiteSpace: 'nowrap',
            }}
          >
            {stage.at ? formatDateTime(stage.at) : '—'}
          </div>
        </div>
      ))}
    </div>
  </div>
);
