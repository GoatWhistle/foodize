import { MapPinIcon, CheckCircleIcon, SmileyIcon, XCircleIcon } from "@phosphor-icons/react";
import type { OrderStatus } from "@shared/types/models";
import { getOrderStatusStyle } from "@shared/utils/orderStatus";
import s from "./OrderStatusBadge.module.css";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  cancellationReason?: string | null;
}

export const OrderStatusBadge = ({ status, cancellationReason }: OrderStatusBadgeProps) => {
  const statusColor = getOrderStatusStyle(status).solid;

  if (status === "PENDING" || status === "ACCEPTED") {
    return (
      <div className={s['iconWrap']}>
        {[0, 1, 2].map((ring) => (
          <div key={ring} className={s['rippleRing']} />
        ))}
        <div aria-hidden="true" className={s['pendingIcon']} style={{ color: statusColor }}>
          <MapPinIcon size={64} weight="fill" />
        </div>
        <p className={s['pendingTitle']}>
          {status === "ACCEPTED" ? "Принят" : "Ожидается"}
        </p>
        <p className={s['subtitle']}>
          {status === "ACCEPTED" ? "Ресторан подтвердил заказ" : "Ожидаем подтверждения ресторана"}
        </p>
      </div>
    );
  }

  if (status === "READY" || status === "COMPLETED") {
    return (
      <div className={`${s['iconWrap']} ${s['readyFlash']}`}>
        <div aria-hidden="true" className={s['readyIcon']} style={{ color: statusColor }}>
          {status === "COMPLETED" ? (
            <SmileyIcon size={80} weight="fill" />
          ) : (
            <CheckCircleIcon size={80} weight="fill" />
          )}
        </div>
        <p className={`${s['readyText']} ${s['readyTitle']}`} style={{ color: statusColor }}>
          {status === "COMPLETED" ? "Приятного аппетита!" : "Забирай!"}
        </p>
        <p className={s['subtitleStrong']}>
          {status === "COMPLETED" ? "Заказ уже получен" : "Заказ ждёт тебя на кассе"}
        </p>
      </div>
    );
  }

  return (
    <div className={s['iconWrap']}>
      <div aria-hidden="true" className={s['readyIcon']} style={{ color: statusColor }}>
        <XCircleIcon size={80} weight="fill" />
      </div>
      <p className={s['cancelledTitle']} style={{ color: statusColor }}>
        Отменён
      </p>
      <p className={s['subtitle']}>
        {cancellationReason || "Заказ был отменён"}
      </p>
    </div>
  );
};
