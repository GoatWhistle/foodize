interface OrderEtaPickerProps {
  etaMinutes: number | null;
  manualEtaTime: string;
  onSelectMinutes: (minutes: number) => void;
  onManualTimeChange: (value: string) => void;
}

export const OrderEtaPicker = ({
  etaMinutes,
  manualEtaTime,
  onSelectMinutes,
  onManualTimeChange,
}: OrderEtaPickerProps) => (
  <div
    style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: 12,
    }}
  >
    <div style={{ color: 'var(--text-3)', fontSize: '0.72rem', marginBottom: 8 }}>
      Время готовности
    </div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {[10, 15, 20].map((minutes) => (
        <button
          key={minutes}
          type="button"
          className={`category-chip${
            !manualEtaTime && etaMinutes === minutes ? ' active' : ''
          }`}
          onClick={() => onSelectMinutes(minutes)}
        >
          {minutes} мин
        </button>
      ))}
    </div>
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginTop: 12,
        color: 'var(--text-3)',
        fontSize: '0.72rem',
      }}
    >
      Указать точное время
      <input
        type="time"
        value={manualEtaTime}
        onChange={(event) => onManualTimeChange(event.target.value)}
        style={{
          width: '100%',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg)',
          color: 'var(--text-1)',
          padding: '10px 12px',
          font: 'inherit',
          fontWeight: 800,
        }}
      />
    </label>
  </div>
);
