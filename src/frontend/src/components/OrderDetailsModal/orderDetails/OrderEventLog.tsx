import { ClockIcon, ArrowRightIcon } from '@phosphor-icons/react';
import { permissionPresetLabel } from '@shared/utils/permissions';
import { orderStatusLabel } from '@shared/utils/locales';
import { useTranslation } from '@shared/i18n/useTranslation';

import type { OrderEvent } from '@shared/types/models';

import { formatDateTime } from './orderDetails.helpers';

interface OrderEventLogProps {
  events: OrderEvent[];
  eventsLoading: boolean;
  eventsUnavailable: boolean;
}

export const OrderEventLog = ({
  events,
  eventsLoading,
  eventsUnavailable,
}: OrderEventLogProps) => {
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
      {t('order.events.title')}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {eventsLoading && (
        <div style={{ color: 'var(--text-3)', fontSize: "var(--text-base)" }}>
          {t('order.events.loading')}
        </div>
      )}
      {!eventsLoading && eventsUnavailable && (
        <div style={{ color: 'var(--text-3)', fontSize: "var(--text-base)" }}>
          {t('order.events.unavailable')}
        </div>
      )}
      {!eventsLoading &&
        !eventsUnavailable &&
        events.length === 0 && (
          <div style={{ color: 'var(--text-3)', fontSize: "var(--text-base)" }}>
            {t('order.events.empty')}
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
            {orderStatusLabel(event.old_status)}{' '}
            <ArrowRightIcon size={12} weight="bold" style={{ verticalAlign: 'middle' }} />{' '}
            {orderStatusLabel(event.new_status)}
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
};
