import {
  HeartIcon,
  StarIcon,
  ChatCircleIcon,
  MapPinIcon,
  ForkKnifeIcon,
} from "@phosphor-icons/react";
import { hapticImpact } from "../../telegram/sdk";
import s from "./RestaurantPage.module.css";
import type { Restaurant } from "@shared/types/models";

interface RestaurantHeroProps {
  restaurant: Restaurant;
  rating: number | null;
  isFav: boolean;
  onToggleFav: () => void;
  onShowReviews: () => void;
  onShowInfo: () => void;
}

export const RestaurantHero = ({
  restaurant,
  rating,
  isFav,
  onToggleFav,
  onShowReviews,
  onShowInfo,
}: RestaurantHeroProps) => (
  <div className={s['hero']}>
    {restaurant.photo_url ? (
      <img
        className={s['heroImg']}
        src={restaurant.photo_url}
        alt={restaurant.name}
      />
    ) : (
      <div className={s['heroPlaceholder']}><ForkKnifeIcon size={48} color="var(--on-photo-mute)" /></div>
    )}
    <div className={s['heroOverlay']} />
    <div className={s['heroInfo']}>
      <div className={s['heroName']}>{restaurant.name}</div>
      {restaurant.address && (
        <div
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--on-photo-dim)",
            marginBottom: 6,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <MapPinIcon size={12} weight="bold" />
          {restaurant.address}
        </div>
      )}
      <div className={s['heroPills']}>
        {rating != null && (
          <span className={`${s['pill']} ${s['pillRating']}`}>
            <StarIcon size={13} weight="fill" />
            {rating.toFixed(1)}
          </span>
        )}
        <button
          className={s['pill']}
          onClick={() => {
            hapticImpact("light");
            onShowReviews();
          }}
        >
          <ChatCircleIcon size={13} weight="bold" />
          Отзывы
        </button>
        <button
          className={s['pill']}
          onClick={() => {
            hapticImpact("light");
            onShowInfo();
          }}
        >
          Инфо
        </button>
      </div>
    </div>
    <button
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        background: isFav ? "var(--color-error-bg)" : "var(--overlay-scrim-soft)",
        border: isFav
          ? "1px solid var(--color-error-border)"
          : "1px solid var(--on-photo-mute)",
        borderRadius: "var(--r-xs)",
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
      onClick={onToggleFav}
      aria-label={isFav ? "Убрать из избранного" : "В избранное"}
    >
      <HeartIcon
        size={16}
        weight={isFav ? "fill" : "regular"}
        color={isFav ? "var(--danger)" : "var(--on-photo-dim)"}
      />
    </button>
  </div>
);
