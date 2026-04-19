import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlass,
  List,
  Fire,
  Hamburger,
  Pizza,
  BowlFood,
  Storefront,
} from "@phosphor-icons/react";
import RestaurantCard from "../../components/ui/RestaurantCard";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { useAuthStore } from "../../store/useAuthStore";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { ROUTES } from "../../constants/routes";

const CATEGORIES = [
  { key: "ALL", label: "Все", icon: <List /> },
  { key: "SHAURMA", label: "Шаурма", icon: <Fire /> },
  { key: "BURGER", label: "Бургеры", icon: <Hamburger /> },
  { key: "PIZZA", label: "Пицца", icon: <Pizza /> },
  { key: "SUSHI", label: "Суши", icon: <BowlFood /> },
];

const HomePage = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const {
    publicRestaurants,
    publicRestaurantsTotal,
    fetchPublicRestaurants,
    loading,
  } = useRestaurantStore();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const size = 20;

  useEffect(() => {
    setPage(1);
  }, [search, onlyOpen, activeCategory]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPublicRestaurants({
        name: search || undefined,
        is_open: onlyOpen ? true : undefined,
        page,
        size,
      });
    }, 400);
    return () => clearTimeout(handler);
  }, [search, onlyOpen, page, fetchPublicRestaurants]);

  const filtered = publicRestaurants.filter((r) => {
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
          <MagnifyingGlass className="search-icon" size={20} weight="bold" />
          <input
            id="restaurant-search"
            type="search"
            placeholder="Поиск ресторана или адреса..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Поиск ресторана"
          />
        </div>
        <label
          className="form-check"
          style={{
            marginTop: "12px",
            width: "fit-content",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <input
            type="checkbox"
            checked={onlyOpen}
            onChange={(e) => setOnlyOpen(e.target.checked)}
          />
          <span className="form-check-label">Только открытые</span>
        </label>
      </div>

      {/* Category chips */}
      <div
        className="categories-scroll"
        role="list"
        aria-label="Категории кухни"
      >
        {CATEGORIES.map(({ key, label, icon }) => (
          <button
            key={key}
            role="listitem"
            id={`category-${key.toLowerCase()}`}
            className={`category-chip${activeCategory === key ? " active" : ""}`}
            onClick={() => setActiveCategory(key)}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Restaurants list */}
      <div className="restaurants-section">
        <div
          className="section-header"
          style={{ display: "flex", alignItems: "baseline", gap: "10px" }}
        >
          <Storefront size={24} weight="bold" color="var(--primary)" />
          <h1 className="section-title" style={{ margin: 0 }}>
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
          <>
            <div className="restaurants-grid">
              {filtered.map((r) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  onClick={() => handleCardClick(r)}
                />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={Math.ceil((publicRestaurantsTotal || 1) / size)}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
