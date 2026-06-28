import {
  Fire,
  Hamburger,
  Pizza,
  BowlFood,
  CookingPot,
  Cookie,
  Coffee,
  DotsThree,
  ProhibitInset,
  Heart,
  Plus,
} from "@phosphor-icons/react";
import s from "./MenuItemCard.module.css";

const CATEGORY_ICONS = {
  SHAURMA: <Fire size={32} />,
  BURGER: <Hamburger size={32} />,
  PIZZA: <Pizza size={32} />,
  SUSHI: <BowlFood size={32} />,
  SNACK: <Cookie size={32} />,
  DRINK: <Coffee size={32} />,
  OTHER: <DotsThree size={32} />,
  DEFAULT: <CookingPot size={32} />,
};

const formatPrice = (value) => `${value} ₽`;

const MenuItemCard = ({
  item,
  onSelect,
  isRestaurantOpen = true,
  onHaptic,
  isFavorite = false,
  onFavoriteToggle,
}) => {
  const icon =
    CATEGORY_ICONS[item.category?.toUpperCase()] || CATEGORY_ICONS.DEFAULT;
  const isClosed = isRestaurantOpen === false;
  const unavailable = item.is_available === false || isClosed;

  const handleClick = () => {
    if (unavailable) return;
    onHaptic?.();
    onSelect?.(item);
  };

  const handleFav = (e) => {
    e.stopPropagation();
    onFavoriteToggle?.(item.id);
  };

  return (
    <div
      className={s.item}
      style={unavailable ? { opacity: 0.5 } : {}}
      onClick={handleClick}
      role="button"
      tabIndex={unavailable ? -1 : 0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      aria-label={`Открыть ${item.name}`}
    >
      <div className={s.img}>
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name} loading="lazy" />
        ) : (
          <div className={s.imgPlaceholder}>{icon}</div>
        )}

        {item.category && (
          <span className={s.categoryTag}>
            {item.category}
          </span>
        )}

        {onFavoriteToggle != null && (
          <button
            className={s.favBtn}
            onClick={handleFav}
            aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
          >
            <Heart
              size={14}
              weight={isFavorite ? "fill" : "regular"}
              color={isFavorite ? "#ef4444" : "rgba(255,255,255,0.9)"}
            />
          </button>
        )}

        {unavailable && (
          <div className={s.unavailableOverlay}>
            <ProhibitInset size={28} color="rgba(255,255,255,0.7)" weight="bold" />
          </div>
        )}
      </div>

      <div className={s.info}>
        <div className={s.name}>{item.name}</div>
        {item.description && <div className={s.desc}>{item.description}</div>}

        <div className={s.footer}>
          <span className={s.price}>{formatPrice(item.price)}</span>
          {!unavailable && (
            <button
              className={s.addBtn}
              onClick={handleClick}
              aria-label={`Добавить ${item.name}`}
            >
              <Plus size={16} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
