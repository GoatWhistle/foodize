import { ClockIcon, ArrowRightIcon } from '@phosphor-icons/react';
import { permissionPresetLabel } from '@shared/utils/permissions';
import type { OrderEvent } from '@shared/types/models';

import { STATUS_LABEL_RU, formatDateTime } from './orderDetails.helpers';

interface OrderEventLogProps {
  events: OrderEvent[];
  eventsLoading: boolean;
  eventsUnavailable: boolean;
}

export const OrderEventLog = ({
  events,
  eventsLoading,
  eventsUnavailable,
}: OrderEventLogProps) => (
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
      Журнал изменений
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {eventsLoading && (
        <div style={{ color: 'var(--text-3)', fontSize: "var(--text-base)" }}>
          Загружаю историю...
        </div>
      )}
      {!eventsLoading && eventsUnavailable && (
        <div style={{ color: 'var(--text-3)', fontSize: "var(--text-base)" }}>
          История изменений пока недоступна
        </div>
      )}
      {!eventsLoading &&
        !eventsUnavailable &&
        events.length === 0 && (
          <div style={{ color: 'var(--text-3)', fontSize: "var(--text-base)" }}>
            История появится после первого изменения статуса
          </div>
        )}
      {events.map((event) => (
        <div
          key={event.id}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontSize: "var(--text-base)" }}>
            {STATUS_LABEL_RU[event.old_status]}{' '}
            <ArrowRightIcon size={12} weight="bold" style={{ verticalAlign: 'middle' }} />{' '}
            {STATUS_LABEL_RU[event.new_status]}
            <div
              style={{
                color: 'var(--text-3)',
                fontSize: "var(--text-sm)",
                marginTop: 2,
              }}
            >
              {permissionPresetLabel(event.actor_permissions)}
            </div>
          </div>
          <div
            style={{
              color: 'var(--text-3)',
              fontSize: "var(--text-sm)",
              whiteSpace: 'nowrap',
            }}
          >
            {formatDateTime(event.created_at)}
          </div>
        </div>
      ))}
    </div>
  </div>
);
