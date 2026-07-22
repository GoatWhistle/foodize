import { useState } from 'react';
import { useTranslation } from '@shared/i18n/useTranslation';
import { KanbanCard } from './KanbanCard';
import type { StaffColumnDef } from '../staffColumns';
import type { StaffOrder } from '../types';

interface KanbanColumnProps {
  column: StaffColumnDef;
  orders: StaffOrder[];
  onAdvance: (order: StaffOrder) => void;
  onCancel: (orderId: string, reason: string | null) => void;
  updating: string | null;
  draggingId: string | null;
  onDragStart: (order: StaffOrder) => void;
  onDragEnd: () => void;
  onDrop: (column: StaffColumnDef) => void;
}

export const KanbanColumn = ({
  column,
  orders,
  onAdvance,
  onCancel,
  updating,
  draggingId,
  onDragStart,
  onDragEnd,
  onDrop,
}: KanbanColumnProps) => {
  const { t } = useTranslation();
  const label = t(column.labelKey);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      role="group"
      aria-label={t('staff.columns.ariaGroup', { label, count: orders.length })}
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onDrop(column);
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 'var(--r-md) var(--r-md) 0 0',
          background: `${column.color}18`,
          border: `1px solid ${column.color}44`,
          borderBottom: 'none',
        }}
      >
        <span style={{ color: column.color }}><column.Icon size={18} weight="fill" /></span>
        <span
          style={{
            fontWeight: 800,
            fontSize: "var(--text-base)",
            color: 'var(--text-1)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            background: `${column.color}33`,
            color: column.color,
            borderRadius: '999px',
            padding: '1px 8px',
            fontSize: "var(--text-sm)",
            fontWeight: 800,
          }}
        >
          {orders.length}
        </span>
      </div>

      <div
        role="list"
        aria-label={label}
        style={{
          flex: 1,
          minHeight: 120,
          padding: '10px',
          borderRadius: '0 0 var(--r-md) var(--r-md)',
          border: `1px solid ${dragOver ? column.color : 'var(--border)'}`,
          borderTop: 'none',
          background: dragOver ? `${column.color}08` : 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        {orders.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-3)',
              fontSize: "var(--text-sm)",
            }}
          >
            {t('staff.columns.empty')}
          </div>
        )}
        {orders.map((order) => (
          <KanbanCard
            key={order.id}
            order={order}
            onAdvance={onAdvance}
            onCancel={onCancel}
            updating={updating}
            dragging={draggingId === order.id}
            onDragStart={() => { onDragStart(order); }}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
};
