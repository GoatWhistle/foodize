import { useRef, useEffect } from "react";

const CATEGORY_EMOJI = {
  SHAURMA: "🌯",
  BURGER: "🍔",
  PIZZA: "🍕",
  SUSHI: "🍣",
  DEFAULT: "🍽️",
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

  const emoji = CATEGORY_EMOJI[restaurant.category] || CATEGORY_EMOJI.DEFAULT;

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
          <div className="card-photo-placeholder">{emoji}</div>
        )}
      </div>

      <div className="card-gradient" />

      <div className="card-body">
        <h2 className="card-title">{restaurant.name}</h2>
        <div className="card-tags">
          <span className="tag-pill">{restaurant.address}</span>
          {restaurant.category && (
            <span className="tag-pill">
              {emoji} {restaurant.category}
            </span>
          )}
          <span className="tag-pill orange">~25 мин</span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
