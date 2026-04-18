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
        <div style={{ position: "relative", zIndex: 1, fontSize: "3.5rem" }}>
          📍
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
        <p style={{ color: "var(--stone)", marginTop: 8 }}>
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
          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth="6"
          />
          {/* Progress */}
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="var(--ember-orange)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="progress-arc"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
          <text
            x="60"
            y="66"
            textAnchor="middle"
            fontSize="24"
            fill="var(--text-primary)"
          >
            🍳
          </text>
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
        <p style={{ color: "var(--stone)", marginTop: 8 }}>
          Повар уже работает над заказом
        </p>
      </div>
    );
  }

  if (status === "READY" || status === "COMPLETED") {
    return (
      <div className="status-icon-wrap status-ready-flash">
        <div style={{ fontSize: "4rem", marginBottom: 12 }}>✅</div>
        <p
          className="status-ready-text"
          style={{
            fontWeight: 800,
            fontSize: "2.5rem",
            letterSpacing: "-0.04em",
            color: "var(--ember-orange)",
          }}
        >
          {status === "COMPLETED" ? "Приятного аппетита!" : "Забирай!"}
        </p>
        <p style={{ color: "var(--stone)", marginTop: 8, fontWeight: 600 }}>
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
        <div style={{ fontSize: "4rem", marginBottom: 12 }}>❌</div>
        <p
          style={{
            fontWeight: 800,
            fontSize: "1.6rem",
            letterSpacing: "-0.03em",
            color: "var(--error, #ef4444)",
          }}
        >
          Заказ отменён
        </p>
        <p style={{ color: "var(--stone)", marginTop: 8 }}>
          Средства будут возвращены
        </p>
      </div>
    );
  }

  return null;
};

export default OrderStatusBadge;
