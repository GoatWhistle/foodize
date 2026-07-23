import {
  HeartIcon,
  StarIcon,
  ChatCircleIcon,
  MapPinIcon,
} from "@phosphor-icons/react";
import { RestaurantHeroShell } from "@shared/components/RestaurantHero/RestaurantHeroShell";
import { hapticImpact } from "../../telegram/sdk";
import s from "./RestaurantPage.module.css";
import type { Restaurant } from "@shared/types/models";
import { useTranslation } from "@shared/i18n/useTranslation";

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
}: RestaurantHeroProps) => {
  const { t } = useTranslation();
  return (
    <RestaurantHeroShell
      name={restaurant.name}
      photoUrl={restaurant.photo_url}
      topRight={
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
          aria-label={isFav ? t("catalog.restaurantCard.removeFromFavorites") : t("catalog.restaurantCard.addToFavorites")}
        >
          <HeartIcon
            size={16}
            weight={isFav ? "fill" : "regular"}
            color={isFav ? "var(--danger)" : "var(--on-photo-dim)"}
          />
        </button>
      }
    >
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
          {t("catalog.reviews.buttonLabel")}
        </button>
        <button
          className={s['pill']}
          onClick={() => {
            hapticImpact("light");
            onShowInfo();
          }}
        >
          {t("catalog.restaurantPage.info")}
        </button>
      </div>
    </RestaurantHeroShell>
  );
};
