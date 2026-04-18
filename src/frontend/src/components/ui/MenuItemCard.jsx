const CATEGORY_EMOJI = {
  SHAURMA: "🌯",
  BURGER: "🍔",
  PIZZA: "🍕",
  SUSHI: "🍣",
};

const formatPrice = (kopecks) => `${kopecks} ₽`;

const MenuItemCard = ({ item, onAdd }) => {
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
              style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
            >
              {CATEGORY_EMOJI[item.category] || "🍽️"} {item.category}
            </span>
          )}
          <span
            className="tag-pill orange"
            style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
          >
            ~{item.prep_time_minutes || 15} мин
          </span>
        </div>
      </div>

      <button
        className="add-btn"
        onClick={() => onAdd?.(item)}
        aria-label={`Добавить ${item.name}`}
        title="Добавить в корзину"
      >
        +
      </button>
    </div>
  );
};

export default MenuItemCard;
