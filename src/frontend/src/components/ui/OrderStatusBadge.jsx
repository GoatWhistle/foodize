import {
  MapPin,
  CookingPot,
  CheckCircle,
  XCircle,
  Smiley,
} from '@phosphor-icons/react';

const OrderStatusBadge = ({ status, progress = 0.6 }) => {
  if (status === 'PENDING' || status === 'ACCEPTED') {
    return (
      <div className="status-icon-wrap">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="ripple-ring"
            style={{
              width: 80,
              height: 80,
              top: '50%',
              left: '50%',
              marginTop: -40,
              marginLeft: -40,
            }}
          />
        ))}
        <div style={{ position: 'relative', zIndex: 1, color: 'var(--fire)' }}>
          <MapPin size={64} weight="fill" />
        </div>
        <p className="status-heading">Принят</p>
        <p className="status-sub">Ресторан подтвердил заказ</p>
      </div>
    );
  }

  if (status === 'COOKING') {
    const r = 48;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - progress);

    return (
      <div className="status-icon-wrap">
        <svg width={120} height={120} viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--border-mid)"
            strokeWidth="6"
          />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--fire)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="progress-arc"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
          <foreignObject x="42" y="42" width="36" height="36">
            <div style={{ color: 'var(--text-1)' }}>
              <CookingPot size={36} weight="bold" />
            </div>
          </foreignObject>
        </svg>
        <p className="status-heading">Готовится</p>
        <p className="status-sub">Повар уже работает над заказом</p>
      </div>
    );
  }

  if (status === 'READY' || status === 'COMPLETED') {
    return (
      <div className="status-icon-wrap status-ready-flash">
        <div style={{ marginBottom: 12, color: 'var(--color-success)' }}>
          {status === 'COMPLETED' ? (
            <Smiley size={80} weight="fill" />
          ) : (
            <CheckCircle size={80} weight="fill" />
          )}
        </div>
        <p
          className={`status-ready-text status-heading${status === 'READY' ? ' status-ready-urge' : ''}`}
          style={{ color: 'var(--color-success)' }}
        >
          {status === 'COMPLETED' ? 'Приятного аппетита!' : 'Забирай!'}
        </p>
        <p className="status-sub" style={{ fontWeight: 600 }}>
          {status === 'COMPLETED'
            ? 'Заказ уже получен'
            : 'Заказ ждёт тебя на кассе'}
        </p>
      </div>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <div className="status-icon-wrap">
        <div style={{ marginBottom: 12, color: 'var(--color-error)' }}>
          <XCircle size={80} weight="fill" />
        </div>
        <p className="status-heading" style={{ color: 'var(--color-error)' }}>
          Заказ отменён
        </p>
        <p className="status-sub">Средства будут возвращены</p>
      </div>
    );
  }

  return null;
};

export default OrderStatusBadge;
