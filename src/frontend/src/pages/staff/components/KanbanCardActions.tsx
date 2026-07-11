import { useState } from 'react';
import { XCircle } from '@phosphor-icons/react';
import type { StaffOrder } from '../types';

interface KanbanCardActionsProps {
  order: StaffOrder;
  onAdvance: (order: StaffOrder) => void;
  onCancel: (orderId: string, reason: string | null) => void;
  updating: string | null;
  nextStatus: string | undefined;
  nextLabel: string | undefined;
  canCancel: boolean;
}

export function KanbanCardActions({
  order,
  onAdvance,
  onCancel,
  updating,
  nextStatus,
  nextLabel,
  canCancel,
}: KanbanCardActionsProps) {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (showCancelForm) {
    return (
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
            background: 'var(--bg-card)',
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
              background: 'var(--color-error)',
              color: 'var(--fire-text)',
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
    );
  }

  return (
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
      {canCancel && (
        <button
          style={{
            height: 44,
            minHeight: 44,
            width: 44,
            minWidth: 44,
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--color-error-border)',
            background: 'transparent',
            color: 'var(--color-error)',
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
  );
}
