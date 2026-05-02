import {
  MapPin,
  CookingPot,
  CheckCircle,
  XCircle,
  Smiley,
} from "@phosphor-icons/react";

const OrderStatusBadge = ({ status, progress = 0.6 }) => {
  if (status === "PENDING" || status === "ACCEPTED") {
    return (
      <div className="status-icon-wrap">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="ripple-ring"
            style={{
              width: 80,
              height: 80,
              top: "50%",
              left: "50%",
              marginTop: -40,
              marginLeft: -40,
            }}
          />
        ))}
        <div style={{ position: "relative", zIndex: 1, color: "var(--fire)" }}>
          <MapPin size={64} weight="fill" />
        </div>
        <p
          style={{
            marginTop: 20,
            fontWeight: 800,
            fontSize: "1.4rem",
            letterSpacing: "-0.03em",
          }}
        >
          Принят
        </p>
        <p style={{ color: "var(--text-3)", marginTop: 8 }}>
          Ресторан подтвердил заказ
        </p>
      </div>
    );
  }

  if (status === "COOKING") {
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
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
          <foreignObject x="42" y="42" width="36" height="36">
            <div style={{ color: "var(--text-1)" }}>
              <CookingPot size={36} weight="bold" />
            </div>
          </foreignObject>
        </svg>
        <p
          style={{
            marginTop: 16,
            fontWeight: 800,
            fontSize: "1.4rem",
            letterSpacing: "-0.03em",
          }}
        >
          Готовится
        </p>
        <p style={{ color: "var(--text-3)", marginTop: 8 }}>
          Повар уже работает над заказом
        </p>
      </div>
    );
  }

  if (status === "READY" || status === "COMPLETED") {
    return (
      <div className="status-icon-wrap status-ready-flash">
        <div style={{ marginBottom: 12, color: "#22c55e" }}>
          {status === "COMPLETED" ? (
            <Smiley size={80} weight="fill" />
          ) : (
            <CheckCircle size={80} weight="fill" />
          )}
        </div>
        <p
          className="status-ready-text"
          style={{
            fontWeight: 800,
            fontSize: "2rem",
            letterSpacing: "-0.04em",
            color: "#22c55e",
          }}
        >
          {status === "COMPLETED" ? "Приятного аппетита!" : "Забирай!"}
        </p>
        <p style={{ color: "var(--text-3)", marginTop: 8, fontWeight: 600 }}>
          {status === "COMPLETED"
            ? "Заказ уже получен"
            : "Заказ ждёт тебя на кассе"}
        </p>
      </div>
    );
  }

  if (status === "CANCELLED") {
    return (
      <div className="status-icon-wrap">
        <div style={{ marginBottom: 12, color: "#ef4444" }}>
          <XCircle size={80} weight="fill" />
        </div>
        <p
          style={{
            fontWeight: 800,
            fontSize: "1.6rem",
            letterSpacing: "-0.03em",
            color: "#ef4444",
          }}
        >
          Заказ отменён
        </p>
        <p style={{ color: "var(--text-3)", marginTop: 8 }}>
          Средства будут возвращены
        </p>
      </div>
    );
  }

  return null;
};

export default OrderStatusBadge;
