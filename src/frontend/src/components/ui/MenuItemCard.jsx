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
      <div className="menu-item-info">
        <div className="menu-item-name">{item.name}</div>
        {item.description && (
          <div className="menu-item-desc">{item.description}</div>
        )}
        <div className="menu-item-footer">
          <span className="menu-item-price">{formatPrice(item.price)}</span>
          {item.category && (
            <span
              className="tag-pill"
              style={{
                fontSize: "0.7rem",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {icon} {item.category}
            </span>
          )}
          <span
            className="tag-pill orange"
            style={{
              fontSize: "0.7rem",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Clock size={12} />~{item.prep_time_minutes || 15} мин
          </span>
        </div>
      </div>

      <button
        className="add-btn"
        onClick={() => onAdd?.(item)}
        aria-label={`Добавить ${item.name}`}
        title="Добавить в корзину"
        style={{
          display: "flex",
          alignItems: "center",
          justifyItems: "center",
        }}
      >
        <Plus size={20} weight="bold" />
      </button>
    </div>
  );
};

export default MenuItemCard;
