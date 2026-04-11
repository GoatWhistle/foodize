import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RestaurantCard from "../../components/ui/RestaurantCard";
import EmptyState from "../../components/ui/EmptyState";
import { useAuthStore } from "../../store/useAuthStore";
import { ROUTES } from "../../constants/routes";

const MOCK_RESTAURANTS = [
  {
    id: "mock-1",
    name: "Шаурма Хаус",
    address: "ул. Ленина, 12",
    vendor_id: "v1",
    category: "SHAURMA",
    photo_url: null,
  },
  {
    id: "mock-2",
    name: "Burger Point",
    address: "пр. Мира, 34",
    vendor_id: "v2",
    category: "BURGER",
    photo_url: null,
  },
  {
    id: "mock-3",
    name: "Pizza Nova",
    address: "ул. Советская, 8",
    vendor_id: "v3",
    category: "PIZZA",
    photo_url: null,
  },
  {
    id: "mock-4",
    name: "Sushi Market",
    address: "ул. Кирова, 55",
    vendor_id: "v4",
    category: "SUSHI",
    photo_url: null,
  },
];

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
  const navigate = useNavigate();

  const filtered = MOCK_RESTAURANTS.filter((r) => {
    const matchCategory =
      activeCategory === "ALL" || r.category === activeCategory;
    const matchSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
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

        {filtered.length === 0 ? (
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
