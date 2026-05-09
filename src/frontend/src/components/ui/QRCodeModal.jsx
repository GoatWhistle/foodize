import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, DownloadSimple, QrCode } from '@phosphor-icons/react';

const QRCodeModal = ({ restaurant, onClose }) => {
  const canvasRef = useRef(null);

  const miniAppUrl = import.meta.env.VITE_MINI_APP_URL || '';
  const webUrl = import.meta.env.VITE_WEB_URL || window.location.origin;

  const publicId = restaurant.display_id || restaurant.id;
  const deepLink = miniAppUrl
    ? `${miniAppUrl}?startapp=restaurant_${publicId}`
    : `${webUrl}/restaurants/${publicId}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, deepLink, {
      width: 240,
      margin: 2,
      color: {
        dark: '#2E2418',
        light: '#F5F0E8',
      },
    }).catch(() => {});
  }, [deepLink]);

  const handleDownload = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(deepLink, {
        width: 512,
        margin: 2,
        color: { dark: '#2E2418', light: '#F5F0E8' },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `qr_${restaurant.name.replace(/\s+/g, '_')}.png`;
      a.click();
    } catch {}
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
        className="modal-content"
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
            <QrCode size={20} color="var(--fire)" weight="fill" />
            <span
              style={{
                fontWeight: 800,
                fontSize: '1rem',
                color: 'var(--text-1)',
              }}
            >
              QR-код
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              display: 'flex',
            }}
          >
            <X size={22} weight="bold" />
          </button>
        </div>

        <p
          style={{
            color: 'var(--text-3)',
            fontSize: '0.8rem',
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          При сканировании откроется страница{' '}
          <strong style={{ color: 'var(--text-1)' }}>{restaurant.name}</strong>
        </p>

        <canvas
          ref={canvasRef}
          style={{
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            display: 'block',
            margin: '0 auto',
          }}
        />

        <p
          style={{
            fontSize: '0.68rem',
            color: 'var(--text-3)',
            marginTop: 12,
            wordBreak: 'break-all',
            lineHeight: 1.4,
          }}
        >
          {deepLink}
        </p>

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
          onClick={handleDownload}
        >
          <DownloadSimple size={16} weight="bold" />
          Скачать PNG
        </button>
      </div>
    </div>
  );
};

export default QRCodeModal;
