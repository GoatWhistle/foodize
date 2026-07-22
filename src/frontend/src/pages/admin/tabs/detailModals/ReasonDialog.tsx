import { useState, useEffect } from 'react';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { ReasonDialogConfig } from '../../useAdminDashboard';

interface ReasonDialogProps {
  dialog: ReasonDialogConfig | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export const ReasonDialog = ({ dialog, loading, onCancel, onConfirm }: ReasonDialogProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason('');
  }, [dialog]);

  if (!dialog) return null;

  const trimmedReason = reason.trim();

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 5000 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: 480,
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <h3 style={{ color: 'var(--text-1)', fontSize: "var(--text-md)", margin: 0 }}>
            {dialog.title}
          </h3>
          <p
            style={{
              color: 'var(--text-3)',
              fontSize: "var(--text-base)",
              lineHeight: 1.55,
              margin: '8px 0 0',
            }}
          >
            {dialog.message}
          </p>
        </div>
        <textarea
          className="form-input"
          value={reason}
          onChange={(event) => { setReason(event.target.value); }}
          placeholder={t('admin.reasonDialog.placeholder')}
          rows={4}
          style={{ minHeight: 112, resize: 'vertical' }}
          autoFocus
        />
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <button className="btn btn-secondary" disabled={loading} onClick={onCancel}>
            {t('common.actions.cancel')}
          </button>
          <button
            className="btn btn-primary"
            disabled={loading || !trimmedReason}
            onClick={() => { onConfirm(trimmedReason); }}
            style={{ background: 'var(--error)' }}
          >
            {loading ? t('admin.reasonDialog.running') : dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
