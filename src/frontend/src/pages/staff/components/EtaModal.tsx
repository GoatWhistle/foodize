import { useState } from 'react';
import type { StaffOrder, EtaPayload } from '../types';

interface EtaModalProps {
  order: StaffOrder;
  onConfirm: (payload: EtaPayload) => void;
  onCancel: () => void;
  updating: boolean;
}

const getOrderDisplayId = (order: StaffOrder): string | number =>
  order.display_id ?? order.id.slice(0, 8);

const buildReadyAtIso = (timeValue: string): string | null => {
  if (!timeValue) return null;
  const [hours, minutes] = timeValue.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const readyAt = new Date();
  readyAt.setHours(hours, minutes, 0, 0);
  if (readyAt.getTime() <= Date.now()) readyAt.setDate(readyAt.getDate() + 1);
  return readyAt.toISOString();
};

const getOrderDefaultEta = (order: StaffOrder): number => {
  const times =
    order.items?.map((i) => i.menu_item_prep_time).filter(Boolean) ?? [];
  return times.length > 0 ? Math.max(...times) : 15;
};

const EtaModal = ({ order, onConfirm, onCancel, updating }: EtaModalProps) => {
  const defaultMinutes = getOrderDefaultEta(order);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(defaultMinutes);
  const [manualTime, setManualTime] = useState('');

  const payload = (): EtaPayload | null => {
    const iso = buildReadyAtIso(manualTime);
    if (iso) return { estimated_ready_at: iso };
    if (etaMinutes) return { estimated_ready_in_minutes: etaMinutes };
    return null;
  };

  const chips = [
    ...new Set([defaultMinutes, 10, 15, 20, 30].filter(Boolean)),
  ].sort((a, b) => a - b);

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 5000 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="modal-content" style={{ maxWidth: 360, padding: '24px' }}>
        <h3 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: 4 }}>
          Заказ #{getOrderDisplayId(order)}
        </h3>
        <p
          style={{
            color: 'var(--text-3)',
            fontSize: '0.8rem',
            marginBottom: 16,
          }}
        >
          Выберите время готовности
        </p>

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          {chips.map((m) => (
            <button
              key={m}
              type="button"
              className={`category-chip${!manualTime && etaMinutes === m ? ' active' : ''}`}
              onClick={() => {
                setEtaMinutes(m);
                setManualTime('');
              }}
            >
              {m} мин{m === defaultMinutes ? ' *' : ''}
            </button>
          ))}
        </div>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            color: 'var(--text-3)',
            fontSize: '0.72rem',
            marginBottom: 8,
          }}
        >
          Или указать точное время
          <input
            type="time"
            value={manualTime}
            onChange={(e) => {
              setManualTime(e.target.value);
              setEtaMinutes(null);
            }}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              background: 'var(--bg)',
              color: 'var(--text-1)',
              padding: '10px 12px',
              font: 'inherit',
              fontWeight: 800,
            }}
          />
        </label>
        <p
          style={{
            color: 'var(--text-3)',
            fontSize: '0.72rem',
            marginBottom: 16,
          }}
        >
          * — рекомендовано по составу заказа
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={updating || !payload()}
            onClick={() => {
              const p = payload();
              if (p) onConfirm(p);
            }}
          >
            {updating ? '...' : 'Начать готовить'}
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default EtaModal;
