import { MapPinIcon, CheckCircleIcon, SmileyIcon, XCircleIcon } from "@phosphor-icons/react";
import type { OrderStatus } from "@shared/types/models";
import s from "./OrderStatusBadge.module.css";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  cancellationReason?: string | null;
}

const OrderStatusBadge = ({ status, cancellationReason }: OrderStatusBadgeProps) => {
  if (status === "PENDING" || status === "ACCEPTED") {
    return (
      <div className={s.iconWrap}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={s.rippleRing}
            style={{ width: 80, height: 80, top: "50%", left: "50%", marginTop: -40, marginLeft: -40 }}
          />
        ))}
        <div aria-hidden="true" style={{ position: "relative", zIndex: 1, color: "var(--accent)" }}>
          <MapPinIcon size={64} weight="fill" />
        </div>
        <p style={{ marginTop: 20, fontWeight: 800, fontSize: "1.4rem", letterSpacing: "-0.03em" }}>
          {status === "ACCEPTED" ? "Принят" : "Ожидается"}
        </p>
        <p style={{ color: "var(--text-3)", marginTop: 8 }}>
          {status === "ACCEPTED" ? "Ресторан подтвердил заказ" : "Ожидаем подтверждения ресторана"}
        </p>
      </div>
    );
  }

  if (status === "READY" || status === "COMPLETED") {
    return (
      <div className={`${s.iconWrap} ${s.readyFlash}`}>
        <div aria-hidden="true" style={{ marginBottom: 12, color: "var(--color-success)" }}>
          {status === "COMPLETED" ? (
            <SmileyIcon size={80} weight="fill" />
          ) : (
            <CheckCircleIcon size={80} weight="fill" />
          )}
        </div>
        <p
          className={s.readyText}
          style={{ fontWeight: 800, fontSize: "2rem", letterSpacing: "-0.04em", color: "var(--color-success)" }}
        >
          {status === "COMPLETED" ? "Приятного аппетита!" : "Забирай!"}
        </p>
        <p style={{ color: "var(--text-3)", marginTop: 8, fontWeight: 600 }}>
          {status === "COMPLETED" ? "Заказ уже получен" : "Заказ ждёт тебя на кассе"}
        </p>
      </div>
    );
  }

  return (
    <div className={s.iconWrap}>
      <div aria-hidden="true" style={{ marginBottom: 12, color: "var(--color-error)" }}>
        <XCircleIcon size={80} weight="fill" />
      </div>
      <p style={{ fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.03em", color: "var(--color-error)" }}>
        Отменён
      </p>
      <p style={{ color: "var(--text-3)", marginTop: 8 }}>
        {cancellationReason || "Заказ был отменён"}
      </p>
    </div>
  );
};

export default OrderStatusBadge;
