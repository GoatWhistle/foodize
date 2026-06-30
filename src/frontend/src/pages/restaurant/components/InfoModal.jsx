import { X } from '@phosphor-icons/react';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const InfoModal = ({ workingHours, onClose }) => (
  <div
    className="modal-overlay"
    onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}
  >
    <div className="modal-content info-modal" style={{ padding: 24, maxWidth: 400 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Информация</h2>
        <button
          onClick={onClose}
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}
        >
          <X size={16} weight="bold" />
        </button>
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Рабочие часы</h3>
      {workingHours.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {workingHours.map((wh) => {
            const dayName = DAYS[wh.day_of_week] ?? DAYS[wh.day_of_week - 1] ?? '';
            return (
              <div key={wh.day_of_week} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-2)' }}>{dayName}</span>
                <span style={{ fontWeight: 600 }}>
                  {wh.is_open
                    ? `${wh.opening_time.slice(0, 5)} - ${wh.closing_time.slice(0, 5)}`
                    : 'Выходной'}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: '0.95rem', color: 'var(--text-3)' }}>Не указаны</div>
      )}
    </div>
  </div>
);

export default InfoModal;
