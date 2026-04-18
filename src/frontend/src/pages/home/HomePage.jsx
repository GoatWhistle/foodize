import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RestaurantCard from "../../components/ui/RestaurantCard";
import EmptyState from "../../components/ui/EmptyState";
import { useAuthStore } from "../../store/useAuthStore";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { ROUTES } from "../../constants/routes";



const CATEGORIES = [
  { key: "ALL", label: "Все", emoji: "🍽️" },
  { key: "SHAURMA", label: "Шаурма", emoji: "🌯" },
  { key: "BURGER", label: "Бургеры", emoji: "🍔" },
  { key: "PIZZA", label: "Пицца", emoji: "🍕" },
  { key: "SUSHI", label: "Суши", emoji: "🍣" },
];

const HomePage = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const { isAuthenticated } = useAuthStore();
  const { publicRestaurants, fetchPublicRestaurants, loading } = useRestaurantStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPublicRestaurants({ name: search || undefined });
    }, 400);
    return () => clearTimeout(handler);
  }, [search, fetchPublicRestaurants]);

  const filtered = publicRestaurants.filter((r) => {
    // Backend filters by name, but we can do category client-side
    const matchCategory =
      activeCategory === "ALL" || r.category === activeCategory;
    return matchCategory;
  });

  const handleCardClick = (restaurant) => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }
    navigate(ROUTES.RESTAURANT.replace(":id", restaurant.id), {
      state: { restaurant },
      viewTransition: true,
    });
  };

  return (
    <div className="home-page page-enter">
      {/* Search bar */}
      <div className="search-bar-wrap">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            id="restaurant-search"
            type="search"
            placeholder="Поиск ресторана или адреса..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Поиск ресторана"
          />
        </div>
      </div>

      {/* Category chips */}
      <div
        className="categories-scroll"
        role="list"
        aria-label="Категории кухни"
      >
        {CATEGORIES.map(({ key, label, emoji }) => (
          <button
            key={key}
            role="listitem"
            id={`category-${key.toLowerCase()}`}
            className={`category-chip${activeCategory === key ? " active" : ""}`}
            onClick={() => setActiveCategory(key)}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Restaurants list */}
      <div className="restaurants-section">
        <div className="section-header">
          <h1 className="section-title">
            {activeCategory === "ALL"
              ? "Все заведения"
              : CATEGORIES.find((c) => c.key === activeCategory)?.label}
          </h1>
          <span className="text-muted" style={{ fontSize: "0.875rem" }}>
            {filtered.length} мест
          </span>
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Ничего не найдено"
            subtitle="Попробуйте другой поиск или категорию"
            action={{
              label: "Сбросить",
              onClick: () => {
                setSearch("");
                setActiveCategory("ALL");
              },
            }}
          />
        ) : (
          <div className="restaurants-grid">
            {filtered.map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                onClick={() => handleCardClick(r)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
