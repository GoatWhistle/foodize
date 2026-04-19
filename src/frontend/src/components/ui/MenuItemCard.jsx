import {
  Fire,
  Hamburger,
  Pizza,
  BowlFood,
  CookingPot,
  Clock,
  Plus,
} from "@phosphor-icons/react";

const CATEGORY_ICONS = {
  SHAURMA: <Fire />,
  BURGER: <Hamburger />,
  PIZZA: <Pizza />,
  SUSHI: <BowlFood />,
  DEFAULT: <CookingPot />,
};

const formatPrice = (kopecks) => `${kopecks} ₽`;

const MenuItemCard = ({ item, onAdd }) => {
  const icon =
    CATEGORY_ICONS[item.category?.toUpperCase()] || CATEGORY_ICONS.DEFAULT;

  return (
    <div className="menu-item">
      {/* Photo / Placeholder */}
      <div className="menu-item-img" style={{ minHeight: "90px" }}>
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name} loading="lazy" />
        ) : (
          <div className="menu-item-img-placeholder">{icon}</div>
        )}
      </div>

      {/* Info */}
      <div className="menu-item-info">
        <div className="menu-item-name">{item.name}</div>
        {item.description && (
          <div className="menu-item-desc">{item.description}</div>
        )}
        <div className="menu-item-footer">
          <span className="menu-item-price">{formatPrice(item.price)}</span>
          <span
            className="tag-pill"
            style={{
              fontSize: "0.68rem",
              background: "var(--bg-raised)",
              color: "var(--text-3)",
              backdropFilter: "none",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Clock size={11} />~{item.prep_time_minutes || 15} мин
          </span>
        </div>
      </div>

      {/* Add button */}
      <div className="menu-item-side">
        <button
          className="add-btn"
          onClick={() => onAdd?.(item)}
          aria-label={`Добавить ${item.name}`}
        >
          <Plus size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
