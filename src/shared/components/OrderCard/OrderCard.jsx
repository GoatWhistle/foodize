import { useState } from "react";
import { CaretRight, CaretDown } from "@phosphor-icons/react";
import s from "./OrderCard.module.css";

const STATUS_CONFIG = {
  PENDING:   { label: "Принимается", color: "var(--accent)",        bg: "var(--accent-subtle)" },
  ACCEPTED:  { label: "Готовится",   color: "var(--accent-dim)",    bg: "oklch(46% 0.12 42 / 0.12)" },
  READY:     { label: "Готово",      color: "var(--color-success)", bg: "var(--color-success-bg)" },
  COMPLETED: { label: "Выдан",       color: "var(--dusk)",          bg: "rgba(107,93,74,0.1)" },
  CANCELLED: { label: "Отменён",     color: "var(--color-error)",   bg: "var(--color-error-bg)" },
};

const RESTAURANT_EMOJI = ["🍕", "🍔", "🌯", "🍱", "🥗", "☕", "🍩", "🥙"];
const getRestaurantEmoji = (id) =>
  RESTAURANT_EMOJI[Math.abs(id?.charCodeAt(0) ?? 0) % RESTAURANT_EMOJI.length];

const getDisplayId = (order) => order.display_id ?? order.id.slice(0, 8);

const formatOrderDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  return isToday
    ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
};

const OrderCard = ({ order, onClick, style, expandable = false }) => {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
  const [open, setOpen] = useState(false);

  const rowContent = (
    <>
      <div className={s.icon}>
        {getRestaurantEmoji(order.restaurant_id)}
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
            {cfg.label}
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
      <div className={s.card} onClick={onClick} style={style} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick?.()}>
        {rowContent}
        <CaretRight size={16} className={s.caret} />
      </div>
    );
  }

  return (
    <div className={s.cardCol} style={style}>
      <div className={s.row} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick?.()}>
        {rowContent}
        <button
          type="button"
          className={s.detailsBtn}
          aria-expanded={open}
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
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
                    {item.selected_options.map((o) => `${o.name}${o.price_delta ? ` +${o.price_delta} ₽` : ""}`).join(", ")}
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
