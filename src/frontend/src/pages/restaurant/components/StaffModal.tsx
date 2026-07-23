import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { XIcon } from '@phosphor-icons/react';
import { useTranslation } from '@shared/i18n/useTranslation';

interface StaffModalProps {
  restaurantName: string;
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
}

export const StaffModal = ({ restaurantName, message, setMessage, onClose, onSubmit, loading, error }: StaffModalProps) => {
  const { t } = useTranslation();
  return (
  <div className="modal-overlay" style={{ zIndex: 3000 }}>
    <div className="modal-content" style={{ maxWidth: '440px', padding: '36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: "var(--text-xl)", fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
          {t('catalog.staffModal.title')}
        </h2>
        <button onClick={onClose} aria-label={t('common.actions.close')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, margin: -11, flexShrink: 0 }}>
          <XIcon size={28} weight="bold" />
        </button>
      </div>
      <p style={{ fontSize: "var(--text-md)", color: 'var(--text-2)', marginBottom: '24px', lineHeight: 1.6 }}>
        {t('catalog.staffModal.questionPrefix')}<span style={{ color: 'var(--fire)', fontWeight: 700 }}>{restaurantName}</span>{t('catalog.staffModal.questionSuffix')}
      </p>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <textarea
          className="form-input"
          placeholder={t('catalog.staffModal.messagePlaceholder')}
          value={message}
          onChange={(e) => { setMessage(e.target.value); }}
          rows={5}
          required
          style={{ borderRadius: 'var(--r-md)', resize: 'vertical' }}
        />
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary btn-full" type="submit" style={{ borderRadius: 'var(--r-md)', height: '52px' }}>
          {loading ? t('catalog.staffModal.submitting') : t('catalog.staffModal.submit')}
        </button>
      </form>
    </div>
  </div>
  );
};
