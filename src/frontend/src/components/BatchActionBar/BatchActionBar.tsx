import type { CSSProperties } from 'react';

const STYLE: CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'var(--bg-card)',
  borderTop: '1px solid var(--border)',
  padding: '12px 20px',
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  zIndex: 1200,
  boxShadow: 'var(--shadow-bar)',
};

export interface BatchAction {
  label: string;
  onClick: () => void;
  color?: string;
}

interface BatchActionBarProps {
  count: number;
  label: string;
  loading?: boolean;
  onClear: () => void;
  actions: BatchAction[];
}

export function BatchActionBar({ count, label, loading, onClear, actions }: BatchActionBarProps) {
  if (!count) return null;
  return (
    <div style={STYLE}>
      <span style={{ fontWeight: 700, fontSize: "var(--text-base)", flex: 1 }}>
        Выбрано: {count} {label}
      </span>
      <button className="btn btn-secondary btn-sm" disabled={loading} onClick={onClear}>
        Снять выделение
      </button>
      {actions.map((action, i) => (
        <button
          key={i}
          className="btn btn-secondary btn-sm"
          disabled={loading}
          onClick={action.onClick}
          style={action.color ? { color: action.color } : undefined}
        >
          {loading ? '...' : action.label}
        </button>
      ))}
    </div>
  );
}
