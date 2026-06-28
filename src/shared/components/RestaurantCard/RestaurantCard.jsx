import { useRef, useEffect } from "react";
import {
  Fire,
  Hamburger,
  Pizza,
  BowlFood,
  Storefront,
  MapPin,
  Star,
  Heart,
  Circle,
} from "@phosphor-icons/react";
import s from "./RestaurantCard.module.css";

const CATEGORY_ICONS = {
  SHAURMA: <Fire size={52} weight="fill" />,
  BURGER: <Hamburger size={52} weight="fill" />,
  PIZZA: <Pizza size={52} weight="fill" />,
  SUSHI: <BowlFood size={52} weight="fill" />,
  DEFAULT: <Storefront size={52} weight="fill" />,
};

const RestaurantCard = ({
  restaurant,
  onClick,
  isFavorite = false,
  onFavoriteToggle,
}) => {
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(s.visible);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const icon =
    CATEGORY_ICONS[restaurant.category?.toUpperCase()] ||
    CATEGORY_ICONS.DEFAULT;
  const rating = restaurant.average_rating;

  return (
    <div
      ref={cardRef}
      className={s.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      aria-label={`Ресторан ${restaurant.name}`}
    >
      <div className={s.photoWrap}>
        {restaurant.photo_url ? (
          <img
            className={s.photo}
            src={restaurant.photo_url}
            alt={restaurant.name}
            loading="lazy"
            style={{ viewTransitionName: `restaurant-image-${restaurant.id}` }}
          />
        ) : (
          <div className={s.photoPlaceholder}>{icon}</div>
        )}

        <div className={s.topRow}>
          {restaurant.is_open != null && (
            <div className={`${s.openBadge}${restaurant.is_open ? ` ${s.open}` : ""}`}>
              <Circle size={7} weight="fill" color={restaurant.is_open ? "#4ade80" : "rgba(255,255,255,0.5)"} />
              {restaurant.is_open ? "Открыто" : "Закрыто"}
            </div>
          )}
          <div className={s.ratingBadge}>
            <Star size={12} weight="fill" color="#facc15" />
            <span>{rating ? rating.toFixed(1) : "0.0"}</span>
          </div>
        </div>

        {onFavoriteToggle != null && (
          <button
            className={`${s.favBtn}${isFavorite ? ` ${s.active}` : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(restaurant.id);
            }}
            aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
          >
            <Heart
              size={14}
              weight={isFavorite ? "fill" : "regular"}
              color={isFavorite ? "#ef4444" : "rgba(255,255,255,0.9)"}
            />
          </button>
        )}
      </div>

      <div className={s.body}>
        <h2 className={s.title}>{restaurant.name}</h2>
        <div className={s.tags}>
          {restaurant.address && (
            <span className={s.tag}>
              <MapPin size={11} weight="bold" />
              {restaurant.address}
            </span>
          )}
          {restaurant.category && (
            <span className={s.tag}>{restaurant.category}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
