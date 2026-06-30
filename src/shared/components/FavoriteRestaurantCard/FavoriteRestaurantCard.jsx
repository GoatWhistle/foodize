import { Heart, MapPin, Briefcase } from "@phosphor-icons/react";
import s from "./FavoriteRestaurantCard.module.css";

const FavoriteRestaurantCard = ({ favorite, onNavigate, onUnfavorite }) => {
  const { restaurant } = favorite;

  return (
    <div className={s.card} onClick={() => onNavigate(restaurant)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onNavigate(restaurant)}>
      <div
        style={{
          width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
          background: restaurant.is_open ? "#22c55e" : "#6b7280",
          boxShadow: restaurant.is_open ? "0 0 6px rgba(34,197,94,0.55)" : "none",
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 }}>
          {restaurant.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "var(--text-3)" }}>
          <MapPin size={11} weight="bold" />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant.address}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 800, color: restaurant.is_open ? "#22c55e" : "#9ca3af" }}>
          {restaurant.is_open ? "Открыто" : "Закрыто"}
        </span>
        {restaurant.is_hiring && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.65rem", fontWeight: 700, color: "var(--amber, #f59e0b)" }}>
            <Briefcase size={10} weight="fill" />
            Вакансии
          </span>
        )}
      </div>

      <button
        className={s.unfavBtn}
        onClick={(e) => { e.stopPropagation(); onUnfavorite(restaurant.id); }}
        aria-label="Убрать из избранного"
      >
        <Heart size={16} weight="fill" color="#ef4444" />
      </button>
    </div>
  );
};

export default FavoriteRestaurantCard;
