import { X } from '@phosphor-icons/react';

const StaffModal = ({ restaurantName, message, setMessage, onClose, onSubmit, loading, error }) => (
  <div className="modal-overlay" style={{ zIndex: 3000 }}>
    <div className="modal-content" style={{ maxWidth: '440px', padding: '36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
          Работа
        </h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
          <X size={28} weight="bold" />
        </button>
      </div>
      <p style={{ fontSize: '1rem', color: 'var(--text-2)', marginBottom: '24px', lineHeight: 1.6 }}>
        Хотите работать в <span style={{ color: 'var(--fire)', fontWeight: 700 }}>{restaurantName}</span>?
      </p>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <textarea
          className="form-input"
          placeholder="Расскажите о себе..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          required
          style={{ borderRadius: 'var(--r-md)', resize: 'vertical' }}
        />
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary btn-full" type="submit" style={{ borderRadius: 'var(--r-md)', height: '52px' }}>
          {loading ? 'Отправка...' : 'Отправить заявку'}
        </button>
      </form>
    </div>
  </div>
);

export default StaffModal;
