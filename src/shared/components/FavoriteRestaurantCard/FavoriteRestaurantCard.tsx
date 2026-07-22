import { HeartIcon, MapPinIcon, BriefcaseIcon } from "@phosphor-icons/react";
import type { Favorite, FavoriteRestaurantInfo } from "@shared/types/models";
import { activateOnKey } from "@shared/utils/a11y";
import { useTranslation } from "@shared/i18n/useTranslation";
import s from "./FavoriteRestaurantCard.module.css";

interface FavoriteRestaurantCardProps {
  favorite: Favorite;
  onNavigate: (restaurant: FavoriteRestaurantInfo) => void;
  onUnfavorite: (restaurantId: string) => void;
}

export const FavoriteRestaurantCard = ({ favorite, onNavigate, onUnfavorite }: FavoriteRestaurantCardProps) => {
  const { t } = useTranslation();
  const { restaurant } = favorite;

  return (
    <div className={s['card']} onClick={() => { onNavigate(restaurant); }} role="button" tabIndex={0} onKeyDown={activateOnKey(() => { onNavigate(restaurant); })}>
      <div
        style={{
          width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
          background: restaurant.is_open ? "var(--color-success)" : "var(--color-neutral)",
          boxShadow: restaurant.is_open ? "0 0 6px var(--color-success-border)" : "none",
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 }}>
          {restaurant.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--text-sm)", color: "var(--text-3)" }}>
          <MapPinIcon size={11} weight="bold" />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant.address}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: restaurant.is_open ? "var(--color-success)" : "var(--color-neutral)" }}>
          {restaurant.is_open ? t("catalog.restaurantCard.open") : t("catalog.restaurantCard.closed")}
        </span>
        {restaurant.is_hiring && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--amber)" }}>
            <BriefcaseIcon size={10} weight="fill" />
            {t("catalog.restaurantCard.vacancies")}
          </span>
        )}
      </div>

      <button
        className={s['unfavBtn']}
        onClick={(e) => { e.stopPropagation(); onUnfavorite(restaurant.id); }}
        aria-label={t("catalog.restaurantCard.removeFromFavorites")}
      >
        <HeartIcon size={16} weight="fill" color="var(--color-error)" />
      </button>
    </div>
  );
};
