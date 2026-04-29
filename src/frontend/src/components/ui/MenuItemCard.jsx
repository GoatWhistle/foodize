import {
  Fire,
  Hamburger,
  Pizza,
  BowlFood,
  CookingPot,
  Clock,
  Plus,
  Leaf,
  Cookie,
  Coffee,
  DotsThree,
  ProhibitInset,
} from "@phosphor-icons/react";

const CATEGORY_ICONS = {
  SHAURMA: <Fire size={36} />,
  BURGER: <Hamburger size={36} />,
  PIZZA: <Pizza size={36} />,
  SUSHI: <BowlFood size={36} />,
  SALAD: <Leaf size={36} />,
  SNACK: <Cookie size={36} />,
  DRINK: <Coffee size={36} />,
  OTHER: <DotsThree size={36} />,
  DEFAULT: <CookingPot size={36} />,
};

const formatPrice = (kopecks) => `${kopecks} ₽`;

const MenuItemCard = ({ item, onAdd }) => {
  const icon =
    CATEGORY_ICONS[item.category?.toUpperCase()] || CATEGORY_ICONS.DEFAULT;
  const unavailable = item.is_available === false;

  return (
    <div
      className="menu-item"
      style={unavailable ? { opacity: 0.45, filter: "grayscale(0.6)" } : {}}
    >
      {/* Photo / Placeholder */}
      <div className="menu-item-img" style={{ minHeight: "90px" }}>
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name} loading="lazy" />
        ) : (
          <div className="menu-item-img-placeholder">{icon}</div>
        )}
        {unavailable && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.45)",
              borderRadius: "inherit",
            }}
          >
            <ProhibitInset
              size={28}
              color="rgba(255,255,255,0.7)"
              weight="bold"
            />
          </div>
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
          {unavailable ? (
            <span
              className="tag-pill"
              style={{
                fontSize: "0.68rem",
                background: "var(--bg-raised)",
                color: "var(--error)",
                border: "1px solid var(--color-error-border)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Недоступно
            </span>
          ) : (
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
          )}
        </div>
      </div>

      {/* Add button */}
      <div className="menu-item-side">
        {!unavailable && (
          <button
            className="add-btn"
            onClick={() => onAdd?.(item)}
            aria-label={`Добавить ${item.name}`}
          >
            <Plus size={18} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuItemCard;
