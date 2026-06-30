import { useState } from 'react';
import { XCircle } from '@phosphor-icons/react';
import useElapsedSeconds from '../../../hooks/useElapsedSeconds';

const STATUS_COLOR = {
  PENDING: '#f59e0b',
  ACCEPTED: '#f97316',
  READY: '#22c55e',
  COMPLETED: '#6b7280',
};

const NEXT_STATUS = {
  PENDING: 'ACCEPTED',
  ACCEPTED: 'READY',
  READY: 'COMPLETED',
};

const NEXT_LABEL = {
  PENDING: 'Принять',
  ACCEPTED: 'Готов',
  READY: 'Выдать',
};

const getOrderDisplayId = (order) => order.display_id ?? order.id.slice(0, 8);

const isRemovalOption = (option) => {
  const name = option.name?.toLowerCase() ?? '';
  return (
    option.price_delta === 0 &&
    (name.startsWith('без') ||
      name.startsWith('убрать') ||
      name.includes('без '))
  );
};

const formatEta = (isoString) => {
  if (!isoString) return null;
  const diff = Math.round((new Date(isoString) - Date.now()) / 60000);
  if (diff <= 0) return 'время вышло';
  return `~${diff} мин`;
};

const KanbanCard = ({
  order,
  onAdvance,
  onCancel,
  updating,
  dragging,
  onDragStart,
  onDragEnd,
}) => {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
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
        borderLeft: `4px solid ${STATUS_COLOR[order.status] || 'var(--border)'}`,
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
                fontSize: '0.7rem',
                fontWeight: 800,
                color: delayUrgency === 'critical' ? '#ef4444' : '#f59e0b',
                background:
                  delayUrgency === 'critical'
                    ? 'rgba(239,68,68,0.12)'
                    : 'rgba(245,158,11,0.1)',
                border: `1px solid ${delayUrgency === 'critical' ? '#ef4444' : '#f59e0b'}`,
                borderRadius: 99,
                padding: '2px 8px',
              }}
            >
              {delayUrgency === 'critical'
                ? `🔥 ${elapsedMins}м`
                : `⏱ ${elapsedMins}м`}
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
                      color: isRemovalOption(opt) ? '#ef4444' : 'var(--text-3)',
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
          }}
        >
          💬 {order.comment}
        </div>
      )}

      {order.status === 'ACCEPTED' && order.estimated_ready_at && (
        <div style={{ fontSize: '0.75rem', color: '#f97316', fontWeight: 700 }}>
          ⏱ {formatEta(order.estimated_ready_at)}
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

      {showCancelForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Причина отмены (необязательно)"
            style={{
              width: '100%',
              minHeight: 64,
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border)',
              padding: '6px 8px',
              fontSize: '0.8rem',
              resize: 'vertical',
              background: 'var(--bg-input)',
              color: 'var(--text-1)',
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, height: 32, fontSize: '0.78rem' }}
              onClick={(e) => {
                e.stopPropagation();
                setShowCancelForm(false);
                setCancelReason('');
              }}
            >
              Назад
            </button>
            <button
              className="btn"
              style={{
                flex: 1,
                height: 32,
                fontSize: '0.78rem',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
              }}
              disabled={updating === order.id}
              onClick={(e) => {
                e.stopPropagation();
                onCancel(order.id, cancelReason || null);
                setShowCancelForm(false);
                setCancelReason('');
              }}
            >
              {updating === order.id ? '...' : 'Подтвердить'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          {nextStatus && (
            <button
              className={
                order.status === 'READY'
                  ? 'btn btn-primary'
                  : 'btn btn-secondary'
              }
              style={{ flex: 1, height: 36, fontSize: '0.8rem' }}
              disabled={updating === order.id}
              onClick={(e) => {
                e.stopPropagation();
                onAdvance(order);
              }}
            >
              {updating === order.id ? '...' : nextLabel}
            </button>
          )}
          {canCancel && onCancel && (
            <button
              style={{
                height: 44,
                minHeight: 44,
                width: 44,
                minWidth: 44,
                borderRadius: 'var(--r-sm)',
                border: '1px solid #ef444466',
                background: 'transparent',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              disabled={updating === order.id}
              onClick={(e) => {
                e.stopPropagation();
                setShowCancelForm(true);
              }}
            >
              <XCircle size={18} weight="fill" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
