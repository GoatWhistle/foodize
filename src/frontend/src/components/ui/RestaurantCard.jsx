import { useRef, useEffect } from "react";
import {
  Fire,
  Hamburger,
  Pizza,
  BowlFood,
  Storefront,
  MapPin,
  Star,
} from "@phosphor-icons/react";

const CATEGORY_ICONS = {
  SHAURMA: <Fire weight="fill" />,
  BURGER: <Hamburger weight="fill" />,
  PIZZA: <Pizza weight="fill" />,
  SUSHI: <BowlFood weight="fill" />,
  DEFAULT: <Storefront weight="fill" />,
};

const RestaurantCard = ({ restaurant, onClick }) => {
  const cardRef = useRef(null);

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
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const icon =
    CATEGORY_ICONS[restaurant.category?.toUpperCase()] ||
    CATEGORY_ICONS.DEFAULT;

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
          <div
            className="card-photo-placeholder"
            style={{ fontSize: "40px", color: "var(--stone)" }}
          >
            {icon}
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(4px)",
            padding: "4px 8px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 2,
          }}
        >
          <Star size={16} weight="fill" color="var(--ember-orange)" />
          <span
            style={{
              color: "#111",
              fontWeight: "800",
              fontSize: "0.85rem",
              lineHeight: 1,
            }}
          >
            {restaurant.average_rating
              ? restaurant.average_rating.toFixed(1)
              : "0.0"}
          </span>
        </div>
      </div>

      <div className="card-gradient" />

      <div className="card-body">
        <h2 className="card-title">{restaurant.name}</h2>
        <div className="card-tags">
          <span className="tag-pill">
            <MapPin size={14} weight="bold" />
            {restaurant.address}
          </span>
          {restaurant.category && (
            <span className="tag-pill">
              {icon}
              {restaurant.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
