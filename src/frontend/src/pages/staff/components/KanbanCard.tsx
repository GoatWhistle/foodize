import type { DragEvent } from 'react';
import { Fire, Timer, ChatText } from '@phosphor-icons/react';
import { getOrderStatusStyle } from '@shared/utils/orderStatus';
import useElapsedSeconds from '../../../hooks/useElapsedSeconds';
import type { OrderItemOption } from '@shared/types/models';
import type { StaffOrder } from '../types';
import { KanbanCardActions } from './KanbanCardActions';

const NEXT_STATUS: Record<string, string | undefined> = {
  PENDING: 'ACCEPTED',
  ACCEPTED: 'READY',
  READY: 'COMPLETED',
};

const NEXT_LABEL: Record<string, string | undefined> = {
  PENDING: 'Принять',
  ACCEPTED: 'Готов',
  READY: 'Выдать',
};

const getOrderDisplayId = (order: StaffOrder): string | number =>
  order.display_id ?? order.id.slice(0, 8);

const isRemovalOption = (option: OrderItemOption): boolean => {
  const name = option.name?.toLowerCase() ?? '';
  return (
    option.price_delta === 0 &&
    (name.startsWith('без') ||
      name.startsWith('убрать') ||
      name.includes('без '))
  );
};

const formatEta = (isoString: string | null | undefined): string | null => {
  if (!isoString) return null;
  const diff = Math.round((new Date(isoString).getTime() - Date.now()) / 60000);
  if (diff <= 0) return 'время вышло';
  return `~${diff} мин`;
};

interface KanbanCardProps {
  order: StaffOrder;
  onAdvance: (order: StaffOrder) => void;
  onCancel: (orderId: string, reason: string | null) => void;
  updating: string | null;
  dragging: boolean;
  onDragStart: (e: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}

const KanbanCard = ({
  order,
  onAdvance,
  onCancel,
  updating,
  dragging,
  onDragStart,
  onDragEnd,
}: KanbanCardProps) => {
  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel = NEXT_LABEL[order.status];
  const elapsed = useElapsedSeconds(
    order.status === 'ACCEPTED' ? order.created_at : null
  );
  const elapsedMins = Math.floor(elapsed / 60);
  const delayUrgency =
    order.status === 'ACCEPTED'
      ? elapsedMins >= 15
        ? 'critical'
        : elapsedMins >= 8
          ? 'warning'
          : null
      : null;
  const canCancel = order.status === 'PENDING' || order.status === 'ACCEPTED';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        borderLeft: `4px solid ${getOrderStatusStyle(order.status).solid}`,
        borderRadius: 'var(--r-md)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'grab',
        opacity: dragging ? 0.4 : 1,
        transition: 'opacity 0.15s',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontWeight: 900,
            fontSize: '1.15rem',
            color: 'var(--text-1)',
          }}
        >
          #{getOrderDisplayId(order)}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {delayUrgency && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.7rem',
                fontWeight: 800,
                color: delayUrgency === 'critical' ? 'var(--color-error)' : 'var(--color-warning-dim)',
                background:
                  delayUrgency === 'critical'
                    ? 'var(--color-error-bg)'
                    : 'var(--color-warning-bg)',
                border: `1px solid ${delayUrgency === 'critical' ? 'var(--color-error-border)' : 'var(--color-warning-border)'}`,
                borderRadius: 99,
                padding: '2px 8px',
              }}
            >
              {delayUrgency === 'critical'
                ? <Fire size={12} weight="fill" />
                : <Timer size={12} weight="bold" />}
              {elapsedMins}м
            </span>
          )}
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-3)',
              fontWeight: 600,
            }}
          >
            {order.total_price} ₽
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {order.items?.map((item) => (
          <div key={item.id}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.84rem',
                color: 'var(--text-2)',
              }}
            >
              <span>{item.menu_item_name ?? item.name ?? 'Позиция'}</span>
              <span
                style={{
                  fontWeight: 700,
                  color: 'var(--text-1)',
                  marginLeft: 8,
                }}
              >
                ×{item.quantity}
              </span>
            </div>
            {item.selected_options?.length > 0 && (
              <div style={{ paddingLeft: 4, marginTop: 1 }}>
                {item.selected_options.map((opt) => (
                  <span
                    key={opt.id}
                    style={{
                      fontSize: '0.72rem',
                      color: isRemovalOption(opt) ? 'var(--color-error)' : 'var(--text-3)',
                      marginRight: 6,
                    }}
                  >
                    {opt.name}
                    {opt.price_delta ? ` +${opt.price_delta}₽` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {order.comment && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 8,
            fontSize: '0.78rem',
            color: 'var(--text-3)',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ChatText size={13} weight="bold" /> {order.comment}
        </div>
      )}

      {order.status === 'ACCEPTED' && order.estimated_ready_at && (
        <div style={{ fontSize: '0.75rem', color: 'var(--fire)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Timer size={13} weight="bold" /> {formatEta(order.estimated_ready_at)}
        </div>
      )}

      {order.requested_pickup_at && (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-3)',
            fontWeight: 700,
          }}
        >
          Ко времени:{' '}
          {new Intl.DateTimeFormat('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(order.requested_pickup_at))}
        </div>
      )}

      <KanbanCardActions
        order={order}
        onAdvance={onAdvance}
        onCancel={onCancel}
        updating={updating}
        nextStatus={nextStatus}
        nextLabel={nextLabel}
        canCancel={canCancel}
      />
    </div>
  );
};

export default KanbanCard;
