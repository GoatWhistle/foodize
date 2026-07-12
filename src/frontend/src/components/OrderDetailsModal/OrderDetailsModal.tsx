import { useState } from 'react';
import { XIcon } from '@phosphor-icons/react';
import { useFocusTrap } from '@shared/hooks/useFocusTrap';
import type { Order, OrderStatus } from '@shared/types/models';

import {
  CANCELLABLE_STATUSES,
  buildReadyAtIso,
  getOrderDisplayId,
  getOrderStages,
} from './orderDetails/orderDetails.helpers';
import { useOrderEvents } from './orderDetails/useOrderEvents';
import { OrderSummaryGrid } from './orderDetails/OrderSummaryGrid';
import { OrderPartiesCard } from './orderDetails/OrderPartiesCard';
import { OrderItemsList } from './orderDetails/OrderItemsList';
import { OrderNotesGrid } from './orderDetails/OrderNotesGrid';
import { OrderEtaPicker } from './orderDetails/OrderEtaPicker';
import { OrderStagesList } from './orderDetails/OrderStagesList';
import { OrderEventLog } from './orderDetails/OrderEventLog';
import { OrderActionsFooter } from './orderDetails/OrderActionsFooter';

export interface OrderStatusChangeData {
  estimated_ready_at?: string;
  estimated_ready_in_minutes?: number;
}

export interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
  nextStatus?: Partial<Record<OrderStatus, OrderStatus>> | undefined;
  nextLabel?: Partial<Record<OrderStatus, string>> | undefined;
  onStatusChange: (
    orderId: string,
    status: OrderStatus,
    data?: OrderStatusChangeData,
  ) => Promise<void>;
  onCancel?: ((orderId: string, reason: string | null) => Promise<void>) | undefined;
  updating: string | null;
}

const OrderDetailsModal = ({
  order,
  onClose,
  nextStatus,
  nextLabel,
  onStatusChange,
  onCancel,
  updating,
}: OrderDetailsModalProps) => {
  const { events, eventsLoading, eventsError, eventsUnavailable, loadEvents } =
    useOrderEvents(order?.id);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [manualEtaTime, setManualEtaTime] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const contentRef = useFocusTrap<HTMLDivElement>({
    active: Boolean(order),
    onEscape: onClose,
  });

  if (!order) return null;

  const next = nextStatus?.[order.status];
  const etaPayload = (): OrderStatusChangeData | null => {
    const manualReadyAt = buildReadyAtIso(manualEtaTime);
    if (manualReadyAt) {
      return { estimated_ready_at: manualReadyAt };
    }
    if (etaMinutes) {
      return { estimated_ready_in_minutes: etaMinutes };
    }
    return null;
  };
  const acceptingRequiresTime = next === 'ACCEPTED';
  const submitPayload: OrderStatusChangeData | null =
    next === 'ACCEPTED' ? etaPayload() : {};
  const canSubmitNext =
    updating !== order.id && (!acceptingRequiresTime || Boolean(submitPayload));
  const stages = getOrderStages(order, events);
  const handleStatusAction = async (
    status: OrderStatus,
    data: OrderStatusChangeData = {},
  ) => {
    await onStatusChange(order.id, status, data);
    await loadEvents();
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    setCancelling(true);
    try {
      await onCancel(order.id, cancelReason.trim() || null);
      onClose();
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = Boolean(onCancel) && CANCELLABLE_STATUSES.has(order.status);

  return (
    <div
      className="modal-overlay order-details-overlay"
      style={{ zIndex: 4000 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={contentRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        style={{
          maxWidth: 560,
          padding: 0,
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <div>
            <div
              id="order-details-title"
              style={{
                color: 'var(--text-3)',
                fontSize: '0.74rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 4,
              }}
            >
              Заказ #{getOrderDisplayId(order)}
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>
              {order.total_price} ₽
            </h3>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div
          style={{
            padding: 22,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <OrderSummaryGrid order={order} />
          <OrderPartiesCard order={order} />
          <OrderItemsList order={order} />
          <OrderNotesGrid order={order} />

          {next === 'ACCEPTED' && (
            <OrderEtaPicker
              etaMinutes={etaMinutes}
              manualEtaTime={manualEtaTime}
              onSelectMinutes={(minutes) => {
                setEtaMinutes(minutes);
                setManualEtaTime('');
              }}
              onManualTimeChange={(value) => {
                setManualEtaTime(value);
                setEtaMinutes(null);
              }}
            />
          )}

          <OrderStagesList stages={stages} />
          <OrderEventLog
            events={events}
            eventsLoading={eventsLoading}
            eventsError={eventsError}
            eventsUnavailable={eventsUnavailable}
          />
        </div>

        {(next || canCancel) && (
          <OrderActionsFooter
            order={order}
            next={next}
            nextLabel={nextLabel}
            updating={updating}
            canCancel={canCancel}
            canSubmitNext={canSubmitNext}
            showCancelForm={showCancelForm}
            cancelReason={cancelReason}
            cancelling={cancelling}
            onShowCancelForm={() => { setShowCancelForm(true); }}
            onHideCancelForm={() => { setShowCancelForm(false); }}
            onCancelReasonChange={setCancelReason}
            onCancel={() => {
              void handleCancel();
            }}
            onSubmitNext={() => {
              if (next) void handleStatusAction(next, submitPayload ?? {});
            }}
          />
        )}
      </div>
    </div>
  );
};

export default OrderDetailsModal;
