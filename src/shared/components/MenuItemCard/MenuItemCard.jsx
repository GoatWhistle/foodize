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
  Plus,
} from "@phosphor-icons/react";
import s from "./MenuItemCard.module.css";

const CATEGORY_ICONS = {
  SHAURMA: <Fire size={28} />,
  BURGER: <Hamburger size={28} />,
  PIZZA: <Pizza size={28} />,
  SUSHI: <BowlFood size={28} />,
  SNACK: <Cookie size={28} />,
  DRINK: <Coffee size={28} />,
  OTHER: <DotsThree size={28} />,
  DEFAULT: <CookingPot size={28} />,
};

const formatPrice = (value) => `${value} ₽`;

const MenuItemCard = ({ item, onSelect, isRestaurantOpen = true, onHaptic }) => {
  const icon =
    CATEGORY_ICONS[item.category?.toUpperCase()] || CATEGORY_ICONS.DEFAULT;
  const isClosed = isRestaurantOpen === false;
  const unavailable = item.is_available === false || isClosed;

  const handleClick = () => {
    if (unavailable) return;
    onHaptic?.();
    onSelect?.(item);
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
          <span className={s.categoryTag}>{item.category}</span>
        )}

        {unavailable && (
          <div className={s.unavailableOverlay}>
            <ProhibitInset size={24} color="rgba(255,255,255,0.7)" weight="bold" />
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
              <Plus size={14} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
