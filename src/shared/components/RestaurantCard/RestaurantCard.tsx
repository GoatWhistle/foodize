import { memo, useRef, useEffect } from "react";
import type { MouseEvent } from "react";
import { MapPinIcon, StarIcon, CircleIcon, HeartIcon } from "@phosphor-icons/react";
import { getCategoryIcon } from "@shared/utils/categoryIcons";
import { activateOnKey } from "@shared/utils/a11y";
import type { Restaurant } from "@shared/types/models";
import s from "./RestaurantCard.module.css";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick?: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  viewTransition?: boolean;
  favPosition?: "top" | "bottom";
}

const RestaurantCardBase = ({
  restaurant,
  onClick,
  isFavorite,
  onFavoriteToggle,
  viewTransition = true,
  favPosition = "top",
}: RestaurantCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (s['visible']) el.classList.add(s['visible']);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => { observer.disconnect(); };
  }, []);

  const icon = getCategoryIcon(undefined, { size: 40, weight: "fill", fallback: "venue" });
  const rating = restaurant.average_rating;

  const favButton = onFavoriteToggle ? (
    <button
      className={`${s['favBtn']}${favPosition === "bottom" ? ` ${s['favBtnBottom']}` : ""}${isFavorite ? ` ${s['active']}` : ""}`}
      onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onFavoriteToggle(restaurant.id); }}
      aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
      aria-pressed={isFavorite}
    >
      <HeartIcon size={14} weight={isFavorite ? "fill" : "regular"} color={isFavorite ? "var(--color-error)" : "var(--on-photo)"} />
    </button>
  ) : null;

  return (
    <div
      ref={cardRef}
      className={s['card']}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={activateOnKey(() => onClick?.())}
      aria-label={`Ресторан ${restaurant.name}`}
    >
      <div className={s['photoWrap']}>
        {restaurant.photo_url ? (
          <img
            className={s['photo']}
            src={restaurant.photo_url}
            alt={restaurant.name}
            loading="lazy"
            style={viewTransition ? { viewTransitionName: `restaurant-image-${restaurant.id}` } : undefined}
          />
        ) : (
          <div className={s['photoPlaceholder']} data-testid="restaurant-photo-placeholder">{icon}</div>
        )}

        <div className={s['topRow']}>
          <div className={`${s['openBadge']}${restaurant.is_open ? ` ${s['open']}` : ""}`}>
            <CircleIcon size={7} weight="fill" color={restaurant.is_open ? "var(--color-success)" : "var(--on-photo-dim)"} />
            {restaurant.is_open ? "Открыто" : "Закрыто"}
          </div>
          <div className={s['rightBadges']}>
            <div className={s['ratingBadge']}>
              <StarIcon size={12} weight="fill" color="var(--star)" />
              <span>{rating ? rating.toFixed(1) : "0.0"}</span>
            </div>
            {favPosition !== "bottom" && favButton}
          </div>
        </div>
        {favPosition === "bottom" && favButton}
      </div>

      <div className={s['body']}>
        <h2 className={s['title']}>{restaurant.name}</h2>
        <div className={s['tags']}>
          {restaurant.address && (
            <span className={s['tag']}>
              <MapPinIcon size={11} weight="bold" />
              {restaurant.address}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const RestaurantCard = memo(RestaurantCardBase);
