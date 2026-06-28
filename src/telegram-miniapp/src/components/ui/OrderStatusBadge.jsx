import { MapPin, CheckCircle, Smiley, XCircle } from "@phosphor-icons/react";
import s from "./OrderStatusBadge.module.css";

const OrderStatusBadge = ({ status }) => {
  if (status === "PENDING" || status === "ACCEPTED") {
    return (
      <div className={s.iconWrap}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={s.rippleRing}
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
        <div style={{ position: "relative", zIndex: 1, color: "var(--accent)" }}>
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
          Ожидается
        </p>
        <p style={{ color: "var(--text-3)", marginTop: 8 }}>
          Ресторан готовит заказ к выдаче
        </p>
      </div>
    );
  }

  if (status === "READY" || status === "COMPLETED") {
    return (
      <div className={`${s.iconWrap} ${s.readyFlash}`}>
        <div style={{ marginBottom: 12, color: "var(--color-success)" }}>
          {status === "COMPLETED" ? (
            <Smiley size={80} weight="fill" />
          ) : (
            <CheckCircle size={80} weight="fill" />
          )}
        </div>
        <p
          className={s.readyText}
          style={{
            fontWeight: 800,
            fontSize: "2rem",
            letterSpacing: "-0.04em",
            color: "var(--color-success)",
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
      <div className={s.iconWrap}>
        <div style={{ marginBottom: 12, color: "var(--color-error)" }}>
          <XCircle size={80} weight="fill" />
        </div>
        <p
          style={{
            fontWeight: 800,
            fontSize: "1.6rem",
            letterSpacing: "-0.03em",
            color: "var(--color-error)",
          }}
        >
          Отменён
        </p>
        <p style={{ color: "var(--text-3)", marginTop: 8 }}>
          Заказ был отменён
        </p>
      </div>
    );
  }

  return null;
};

export default OrderStatusBadge;
