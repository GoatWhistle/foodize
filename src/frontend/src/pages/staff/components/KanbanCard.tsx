import type { DragEvent } from 'react';
import { FireIcon, TimerIcon, ChatTextIcon } from '@phosphor-icons/react';
import { getOrderStatusStyle, getOrderStatusLabel } from '@shared/utils/orderStatus';
import { useElapsedSeconds } from '../../../hooks/useElapsedSeconds';
import type { OrderItemOption } from '@shared/types/models';
import type { StaffOrder } from '../types';
import { KanbanCardActions } from './KanbanCardActions';
import { formatPrice } from '@shared/utils/price';
import s from './KanbanCard.module.css';

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
  order.display_id;

const isRemovalOption = (option: OrderItemOption): boolean => {
  const name = option.name.toLowerCase();
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

export const KanbanCard = ({
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
      role="listitem"
      draggable
      aria-roledescription="Перетаскиваемая карточка заказа"
      aria-label={`Заказ №${getOrderDisplayId(order)}, статус: ${getOrderStatusLabel(order.status)}`}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={s['card']}
      style={{
        borderLeft: `4px solid ${getOrderStatusStyle(order.status).solid}`,
        opacity: dragging ? 0.4 : 1,
      }}
    >
      <div className={s['header']}>
        <span className={s['orderId']}>#{getOrderDisplayId(order)}</span>
        <div className={s['headerRight']}>
          {delayUrgency && (
            <span
              className={s['delayBadge']}
              style={{
                color: delayUrgency === 'critical' ? 'var(--color-error)' : 'var(--color-warning-dim)',
                background:
                  delayUrgency === 'critical'
                    ? 'var(--color-error-bg)'
                    : 'var(--color-warning-bg)',
                border: `1px solid ${delayUrgency === 'critical' ? 'var(--color-error-border)' : 'var(--color-warning-border)'}`,
              }}
            >
              {delayUrgency === 'critical'
                ? <FireIcon size={12} weight="fill" />
                : <TimerIcon size={12} weight="bold" />}
              {elapsedMins}м
            </span>
          )}
          <span className={s['price']}>{formatPrice(order.total_price)}</span>
        </div>
      </div>

      <div className={s['items']}>
        {order.items.map((item) => (
          <div key={item.id}>
            <div className={s['itemRow']}>
              <span>{item.menu_item_name}</span>
              <span className={s['itemQty']}>×{item.quantity}</span>
            </div>
            {item.selected_options && item.selected_options.length > 0 && (
              <div className={s['itemOptions']}>
                {item.selected_options.map((opt) => (
                  <span
                    key={opt.id}
                    className={s['itemOption']}
                    style={{
                      color: isRemovalOption(opt) ? 'var(--color-error)' : 'var(--text-3)',
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
        <div className={s['comment']}>
          <ChatTextIcon size={13} weight="bold" /> {order.comment}
        </div>
      )}

      {order.status === 'ACCEPTED' && order.estimated_ready_at && (
        <div className={s['eta']}>
          <TimerIcon size={13} weight="bold" /> {formatEta(order.estimated_ready_at)}
        </div>
      )}

      {order.requested_pickup_at && (
        <div className={s['pickup']}>
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
