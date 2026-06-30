import { CaretRight } from "@phosphor-icons/react";
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

const OrderCard = ({ order, onClick, style }) => {
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;

  return (
    <div className={s.card} onClick={onClick} style={style} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick?.()}>
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

      <CaretRight size={16} className={s.caret} />
    </div>
  );
};

export default OrderCard;
