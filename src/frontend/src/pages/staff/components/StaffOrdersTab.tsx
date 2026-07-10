import { Fire } from '@phosphor-icons/react';
import KanbanColumn from './KanbanColumn';
import { COLUMN_DEFS } from '../staffColumns';
import type { StaffColumnDef } from '../staffColumns';
import type { StaffOrder } from '../types';

interface StaffOrdersTabProps {
  orders: StaffOrder[];
  ordersLoading: boolean;
  updating: string | null;
  draggingOrderId: string | null;
  onAdvance: (order: StaffOrder) => void;
  onCancel: (orderId: string, reason: string | null) => void;
  onDragStart: (order: StaffOrder) => void;
  onDragEnd: () => void;
  onDrop: (column: StaffColumnDef) => void;
}

const StaffOrdersTab = ({
  orders,
  ordersLoading,
  updating,
  draggingOrderId,
  onAdvance,
  onCancel,
  onDragStart,
  onDragEnd,
  onDrop,
}: StaffOrdersTabProps) => {
  if (ordersLoading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  const criticalOrders = orders.filter(
    (o) =>
      o.status === 'ACCEPTED' &&
      Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000) >= 15
  );

  return (
    <>
      {criticalOrders.length > 0 && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 12,
            background: 'var(--color-error-bg)',
            border: '1px solid var(--color-error-border)',
            borderRadius: 'var(--r-md)',
            color: 'var(--color-error)',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Fire size={16} weight="fill" /> {criticalOrders.length}{' '}
          {criticalOrders.length === 1
            ? 'заказ задерживается'
            : criticalOrders.length < 5
              ? 'заказа задерживается'
              : 'заказов задерживается'}{' '}
          — проверьте принятые
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {COLUMN_DEFS.map((col) => {
          const colOrders = orders.filter((o) =>
            col.statuses.includes(o.status)
          );
          return (
            <KanbanColumn
              key={col.id}
              column={col}
              orders={colOrders}
              onAdvance={onAdvance}
              onCancel={onCancel}
              updating={updating}
              draggingId={draggingOrderId}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
            />
          );
        })}
      </div>
    </>
  );
};

export default StaffOrdersTab;
