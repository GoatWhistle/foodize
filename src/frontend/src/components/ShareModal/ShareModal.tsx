import { useState } from 'react';
import { XIcon, CopyIcon, CheckIcon } from '@phosphor-icons/react';
import { TelegramLogo } from '@shared/components/BrandIcons/TelegramLogo';
import { useFocusTrap } from '@shared/hooks/useFocusTrap';
import { useTranslation } from '@shared/i18n/useTranslation';
import type { Restaurant } from '@shared/types/models';

interface ShareModalProps {
  restaurant: Restaurant;
  onClose: () => void;
}

export const ShareModal = ({ restaurant, onClose }: ShareModalProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const contentRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });

  const miniAppUrl = import.meta.env['VITE_MINI_APP_URL'] || '';
  const webUrl = import.meta.env['VITE_WEB_URL'] || window.location.origin;

  const targetId = restaurant.display_id;

  const deepLink = miniAppUrl
    ? `${miniAppUrl}?startapp=restaurant_${targetId}`
    : `${webUrl}/restaurants/${targetId}`;

  const text = t('profile.share.text', { restaurant: restaurant.name });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => { setCopied(false); }, 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => { setCopyError(false); }, 3000);
    }
  };

  const handleTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  return (
    <div
      className="modal-overlay"
      data-testid="share-modal-overlay"
      style={{ zIndex: 5000, padding: 20 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={contentRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        tabIndex={-1}
        style={{
          maxWidth: 340,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            id="share-modal-title"
            style={{
              fontWeight: 800,
              fontSize: "var(--text-md)",
              color: 'var(--text-1)',
            }}
          >
            {t('profile.share.title')}
          </span>
          <button
            onClick={onClose}
            aria-label={t('common.actions.close')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              margin: -11,
              flexShrink: 0,
            }}
          >
            <XIcon size={22} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={handleTelegram}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px',
              background: 'var(--brand-telegram-subtle)',
              color: 'var(--brand-telegram-strong)',
              border: '1px solid var(--brand-telegram-border)',
            }}
          >
            <TelegramLogo size={20} variant="color" />
            {t('profile.share.telegram')}
          </button>

          <button
            onClick={() => {
              void handleCopy();
            }}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px',
            }}
          >
            {copied ? (
              <>
                <CheckIcon size={20} color="var(--color-success)" weight="bold" />
                <span style={{ color: 'var(--color-success)' }}>
                  {t('profile.share.copied')}
                </span>
              </>
            ) : copyError ? (
              <span style={{ color: 'var(--color-error)' }}>
                {t('profile.share.copyFailed')}
              </span>
            ) : (
              <>
                <CopyIcon size={20} />
                {t('profile.share.copyLink')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
