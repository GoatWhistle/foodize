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

      {/* Rating badge */}
      <div className="card-rating-badge">
        <Star size={13} weight="fill" color="var(--fire, #ff4520)" />
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
