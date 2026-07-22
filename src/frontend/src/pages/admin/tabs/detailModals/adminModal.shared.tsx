import type { ReactNode } from 'react';
import { XIcon } from '@phosphor-icons/react';
import { t, useTranslation } from '@shared/i18n/useTranslation';

interface DetailFieldProps {
  label: ReactNode;
  children?: ReactNode;
  mono?: boolean;
}

interface DetailModalProps {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  loading?: boolean;
  children?: ReactNode;
}

export const formatDateTime = (value?: string | null) => {
  if (!value) return t('common.states.dash');
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const DetailField = ({ label, children, mono = false }: DetailFieldProps) => {
  const { t: translate } = useTranslation();
  return (
  <div
    style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-sm)',
      padding: 12,
      minWidth: 0,
    }}
  >
    <div
      style={{
        color: 'var(--text-3)',
        fontSize: "var(--text-xs)",
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div
      style={{
        color: 'var(--text-1)',
        fontWeight: 800,
        fontSize: mono ? '0.78rem' : '0.9rem',
        fontFamily: mono ? 'monospace' : 'inherit',
        overflowWrap: 'anywhere',
      }}
    >
      {children ?? translate('common.states.dash')}
    </div>
  </div>
  );
};

export const DetailModal = ({ title, subtitle, onClose, loading, children }: DetailModalProps) => {
  const { t: translate } = useTranslation();
  return (
  <div
    className="modal-overlay"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <div
      className="modal-content"
      style={{
        maxWidth: 620,
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
          gap: 16,
        }}
      >
        <div>
          <div
            style={{ color: 'var(--text-3)', fontSize: "var(--text-sm)", fontWeight: 800 }}
          >
            {subtitle}
          </div>
          <h3 style={{ margin: '4px 0 0', color: 'var(--text-1)', fontSize: "var(--text-md)" }}>
            {title}
          </h3>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onClose}
          aria-label={translate('common.actions.close')}
        >
          <XIcon size={16} />
        </button>
      </div>
      <div style={{ padding: 22, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ width: '100%', height: 24, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: '80%', height: 16, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: '90%', height: 16, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 4 }} />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  </div>
  );
};
