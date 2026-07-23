import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { XIcon, DownloadSimpleIcon, QrCodeIcon } from '@phosphor-icons/react';
import { useFocusTrap } from '@shared/hooks/useFocusTrap';
import { logError } from '@shared/utils/logError';
import { useTranslation } from '@shared/i18n/useTranslation';

import type { Restaurant } from '@shared/types/models';

type QRCodeType = 'site' | 'telegram';

type QRCodeRestaurant = Pick<Restaurant, 'id' | 'display_id' | 'name'>;

interface QRCodeModalProps {
  restaurant: QRCodeRestaurant;
  onClose: () => void;
  initialType?: QRCodeType;
}

export const QRCodeModal = ({ restaurant, onClose, initialType = 'site' }: QRCodeModalProps) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const [type, setType] = useState<QRCodeType>(initialType);

  const webUrl = String(import.meta.env['VITE_WEB_URL'] || window.location.origin);
  const botUsername = String(import.meta.env['VITE_BOT_USERNAME'] || '').replace(
    /^@/,
    ''
  );

  const publicId = restaurant.display_id || restaurant.id;
  const siteLink = `${webUrl.replace(/\/$/, '')}/restaurants/${publicId}`;
  const telegramLink = botUsername
    ? `https://t.me/${botUsername}?start=restaurant_${publicId}`
    : '';
  const deepLink = type === 'telegram' ? telegramLink : siteLink;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!deepLink) {
      const context = canvas.getContext('2d');
      context?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    void (async () => {
      try {
        await QRCode.toCanvas(canvas, deepLink, {
          width: 240,
          margin: 2,
          color: {
            dark: '#2E2418',
            light: '#F5F0E8',
          },
        });
      } catch (error) {
        logError('QRCodeModal.toCanvas', error);
      }
    })();
  }, [deepLink]);

  const handleDownload = async () => {
    if (!deepLink) return;
    try {
      const dataUrl = await QRCode.toDataURL(deepLink, {
        width: 512,
        margin: 2,
        color: { dark: '#2E2418', light: '#F5F0E8' },
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `qr_${type}_${restaurant.name.replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (error) {
      logError('QRCodeModal.download', error);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 5000 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={contentRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
        tabIndex={-1}
        style={{ maxWidth: 320, padding: '28px 24px', textAlign: 'center' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <QrCodeIcon size={20} color="var(--fire)" weight="fill" />
            <span
              id="qr-modal-title"
              style={{
                fontWeight: 800,
                fontSize: "var(--text-md)",
                color: 'var(--text-1)',
              }}
            >
              {t('profile.qr.title')}
            </span>
          </div>
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
            <XIcon size={22} weight="bold" />
          </button>
        </div>

        <p
          style={{
            color: 'var(--text-3)',
            fontSize: "var(--text-base)",
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          {t('profile.qr.hintPrefix')}
          <strong style={{ color: 'var(--text-1)' }}>{restaurant.name}</strong>
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            marginBottom: 16,
          }}
        >
          {([
            ['site', 'profile.qr.site'],
            ['telegram', 'profile.qr.telegram'],
          ] as [QRCodeType, string][]).map(([value, labelKey]) => (
            <button
              key={value}
              type="button"
              className={
                type === value ? 'btn btn-primary' : 'btn btn-secondary'
              }
              onClick={() => { setType(value); }}
              style={{ height: 44, fontSize: "var(--text-sm)" }}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        <canvas
          ref={canvasRef}
          style={{
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            display: 'block',
            margin: '0 auto',
          }}
        />

        {deepLink ? (
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: 'var(--text-3)',
              marginTop: 12,
              wordBreak: 'break-all',
              lineHeight: 1.4,
            }}
          >
            {deepLink}
          </p>
        ) : (
          <p
            className="form-error"
            style={{
              fontSize: "var(--text-sm)",
              marginTop: 12,
              lineHeight: 1.4,
              textAlign: 'left',
            }}
          >
            {t('profile.qr.botMissing', { id: publicId })}
          </p>
        )}

        <button
          className="btn btn-primary"
          style={{
            width: '100%',
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
          onClick={() => {
            void handleDownload();
          }}
          disabled={!deepLink}
        >
          <DownloadSimpleIcon size={16} weight="bold" />
          {t('profile.qr.download')}
        </button>
      </div>
    </div>
  );
};
