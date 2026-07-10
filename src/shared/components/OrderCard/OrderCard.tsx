import { useState } from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { CaretRight, CaretDown, Storefront } from "@phosphor-icons/react";
import { getOrderStatusStyle, getCustomerOrderStatusLabel } from "@shared/utils/orderStatus";
import { formatOptionsSummary } from "@shared/utils/price";
import type { Order } from "@shared/types/models";
import s from "./OrderCard.module.css";

const getDisplayId = (order: Order): string => String(order.display_id ?? order.id.slice(0, 8));

const formatOrderDate = (value: string | null | undefined): string => {
  if (!value) return "";
  const d = new Date(value);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  return isToday
    ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
  style?: CSSProperties;
  expandable?: boolean;
}

const OrderCard = ({ order, onClick, style, expandable = false }: OrderCardProps) => {
  const cfg = getOrderStatusStyle(order.status);
  const label = getCustomerOrderStatusLabel(order.status);
  const [open, setOpen] = useState(false);

  const rowContent = (
    <>
      <div className={s.icon}>
        <Storefront size={22} weight="fill" />
      </div>

      <div className={s.body}>
        <div className={s.topRow}>
          <span className={s.orderId}>#{getDisplayId(order)}</span>
          {order.restaurant_name && (
            <span className={s.restaurantName}>{order.restaurant_name}</span>
          )}
        </div>
        <div className={s.bottomRow}>
          <span className={s.statusBadge} style={{ color: cfg.color, background: cfg.bg }}>
            {label}
          </span>
          <span className={s.count}>{order.items?.length || 0} поз.</span>
        </div>
      </div>

      <div className={s.right}>
        <div className={s.price}>{order.total_price} ₽</div>
        <div className={s.date}>{formatOrderDate(order.created_at)}</div>
      </div>
    </>
  );

  if (!expandable) {
    return (
      <div className={s.card} onClick={onClick} style={style} role="button" tabIndex={0} onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => e.key === "Enter" && onClick?.()}>
        {rowContent}
        <CaretRight size={16} className={s.caret} />
      </div>
    );
  }

  return (
    <div className={s.cardCol} style={style}>
      <div className={s.row} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => e.key === "Enter" && onClick?.()}>
        {rowContent}
        <button
          type="button"
          className={s.detailsBtn}
          aria-expanded={open}
          onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); setOpen((v) => !v); }}
        >
          детали
          <CaretDown size={12} weight="bold" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s var(--ease-out)" }} />
        </button>
      </div>

      {open && (
        <div className={s.details}>
          {Array.isArray(order.items) && order.items.map((item) => (
            <div key={item.id} className={s.detailItem}>
              <span className={s.detailQty}>×{item.quantity}</span>
              <div className={s.detailInfo}>
                <div className={s.detailName}>{item.menu_item_name}</div>
                {item.selected_options?.length > 0 && (
                  <div className={s.detailOpts}>
                    {formatOptionsSummary(item.selected_options)}
                  </div>
                )}
              </div>
              <span className={s.detailPrice}>{item.price_at_purchase * item.quantity} ₽</span>
            </div>
          ))}
          {order.restaurant_address && (
            <div className={s.detailAddress}>{order.restaurant_address}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
