import { XCircleIcon } from '@phosphor-icons/react';
import type { Order, OrderStatus } from '@shared/types/models';

interface OrderActionsFooterProps {
  order: Order;
  next: OrderStatus | undefined;
  nextLabel?: Partial<Record<OrderStatus, string>> | undefined;
  updating: string | null;
  canCancel: boolean;
  canSubmitNext: boolean;
  showCancelForm: boolean;
  cancelReason: string;
  cancelling: boolean;
  onShowCancelForm: () => void;
  onHideCancelForm: () => void;
  onCancelReasonChange: (value: string) => void;
  onCancel: () => void;
  onSubmitNext: () => void;
}

export const OrderActionsFooter = ({
  order,
  next,
  nextLabel,
  updating,
  canCancel,
  canSubmitNext,
  showCancelForm,
  cancelReason,
  cancelling,
  onShowCancelForm,
  onHideCancelForm,
  onCancelReasonChange,
  onCancel,
  onSubmitNext,
}: OrderActionsFooterProps) => (
  <div
    style={{
      padding: '14px 22px',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
  >
    {showCancelForm ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea
          className="form-input"
          placeholder="Причина отмены (необязательно)"
          value={cancelReason}
          onChange={(e) => { onCancelReasonChange(e.target.value); }}
          rows={2}
          style={{ resize: 'none', fontSize: '0.85rem' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary"
            onClick={onHideCancelForm}
            disabled={cancelling}
            style={{ flex: 1 }}
          >
            Назад
          </button>
          <button
            className="btn"
            onClick={onCancel}
            disabled={cancelling}
            style={{
              flex: 1,
              background: 'var(--color-error)',
              color: 'var(--fire-text)',
              border: 'none',
            }}
          >
            {cancelling ? '...' : 'Подтвердить отмену'}
          </button>
        </div>
      </div>
    ) : (
      <div style={{ display: 'flex', gap: 8 }}>
        {canCancel && (
          <button
            className="btn btn-secondary"
            onClick={onShowCancelForm}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <XCircleIcon size={16} />
            Отменить
          </button>
        )}
        {next && (
          <button
            className="btn btn-primary"
            disabled={!canSubmitNext}
            onClick={onSubmitNext}
            style={{ flex: 1 }}
          >
            {updating === order.id
              ? '...'
              : nextLabel?.[order.status] || 'Дальше'}
          </button>
        )}
      </div>
    )}
  </div>
);
