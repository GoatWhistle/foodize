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
} from "@phosphor-icons/react";
import { useAuthStore } from "../../store/useAuthStore";
import { useFavoriteStore } from "../../store/useFavoriteStore";
import { useShallow } from "zustand/react/shallow";

const CATEGORY_ICONS = {
  SHAURMA: <Fire size={52} weight="fill" />,
  BURGER: <Hamburger size={52} weight="fill" />,
  PIZZA: <Pizza size={52} weight="fill" />,
  SUSHI: <BowlFood size={52} weight="fill" />,
  DEFAULT: <Storefront size={52} weight="fill" />,
};

const RestaurantCard = ({ restaurant, onClick }) => {
  const cardRef = useRef(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { favoriteIds, toggle } = useFavoriteStore(
    useShallow((s) => ({
      favoriteIds: s.favoriteIds,
      toggle: s.toggle,
    })),
  );
  const isFav = favoriteIds.has(restaurant.id);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
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
      className="restaurant-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      aria-label={`Ресторан ${restaurant.name}`}
    >
      {/* Photo */}
      <div className="card-photo-wrap">
        {restaurant.photo_url ? (
          <img
            className="card-photo"
            src={restaurant.photo_url}
            alt={restaurant.name}
            loading="lazy"
            style={{ viewTransitionName: `restaurant-image-${restaurant.id}` }}
          />
        ) : (
          <div className="card-photo-placeholder">{icon}</div>
        )}
      </div>

      {/* Scrim */}
      <div className="card-scrim" />

      {/* Open / Closed badge */}
      {restaurant.is_open != null && (
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: restaurant.is_open
              ? "rgba(255,255,255,0.88)"
              : "rgba(255,255,255,0.78)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${restaurant.is_open ? "rgba(34,197,94,0.4)" : "rgba(107,114,128,0.3)"}`,
            borderRadius: "var(--r-xs)",
            padding: "4px 9px",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: restaurant.is_open ? "#22c55e" : "#6b7280",
              flexShrink: 0,
              boxShadow: restaurant.is_open
                ? "0 0 6px rgba(34,197,94,0.7)"
                : "none",
            }}
          />
          <span
            style={{
              fontSize: "0.62rem",
              fontWeight: 800,
              letterSpacing: "0.05em",
              color: restaurant.is_open ? "#22c55e" : "#9ca3af",
            }}
          >
            {restaurant.is_open ? "Открыто" : "Закрыто"}
          </span>
        </div>
      )}

      {/* Heart / Favourite button */}
      {isAuthenticated && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggle(restaurant.id);
          }}
          style={{
            position: "absolute",
            bottom: 14,
            right: 14,
            zIndex: 3,
            width: 32,
            height: 32,
            borderRadius: "var(--r-xs)",
            background: isFav ? "rgba(239,68,68,0.18)" : "rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
            border: isFav
              ? "1px solid rgba(239,68,68,0.4)"
              : "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all var(--dur-sm) var(--ease-spring)",
          }}
          aria-label={isFav ? "Убрать из избранного" : "Добавить в избранное"}
        >
          <Heart
            size={15}
            weight={isFav ? "fill" : "regular"}
            color={isFav ? "#ef4444" : "rgba(255,255,255,0.8)"}
          />
        </button>
      )}

      {/* Rating badge */}
      <div className="card-rating-badge">
        <Star size={13} weight="fill" color="var(--fire, #f59e0b)" />
        <span>{rating ? rating.toFixed(1) : "0.0"}</span>
      </div>

      {/* Content */}
      <div className="card-body">
        <h2 className="card-title">{restaurant.name}</h2>
        <div className="card-tags card-reveal">
          <span className="tag-pill">
            <MapPin size={12} weight="bold" />
            {restaurant.address}
          </span>
          {restaurant.category && (
            <span className="tag-pill">{restaurant.category}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
