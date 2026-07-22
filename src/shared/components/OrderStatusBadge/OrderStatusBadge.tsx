import { MapPinIcon, CheckCircleIcon, SmileyIcon, XCircleIcon } from "@phosphor-icons/react";
import type { OrderStatus } from "@shared/types/models";
import { getOrderStatusStyle } from "@shared/utils/orderStatus";
import { useTranslation } from "@shared/i18n/useTranslation";
import s from "./OrderStatusBadge.module.css";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  cancellationReason?: string | null;
}

export const OrderStatusBadge = ({ status, cancellationReason }: OrderStatusBadgeProps) => {
  const { t } = useTranslation();
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
          {status === "ACCEPTED" ? t("order.badge.acceptedTitle") : t("order.badge.pendingTitle")}
        </p>
        <p className={s['subtitle']}>
          {status === "ACCEPTED" ? t("order.badge.acceptedSubtitle") : t("order.badge.pendingSubtitle")}
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
          {status === "COMPLETED" ? t("order.badge.completedTitle") : t("order.badge.readyTitle")}
        </p>
        <p className={s['subtitleStrong']}>
          {status === "COMPLETED" ? t("order.badge.completedSubtitle") : t("order.badge.readySubtitle")}
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
        {t("order.badge.cancelledTitle")}
      </p>
      <p className={s['subtitle']}>
        {cancellationReason || t("order.badge.cancelledSubtitle")}
      </p>
    </div>
  );
};
