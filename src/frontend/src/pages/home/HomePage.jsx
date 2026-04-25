import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, Storefront, Briefcase } from "@phosphor-icons/react";
import RestaurantCard from "../../components/ui/RestaurantCard";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import { useAuthStore } from "../../store/useAuthStore";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { ROUTES } from "../../constants/routes";

const HomePage = () => {
  const [search, setSearch] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [isHiring, setIsHiring] = useState(false);
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
  }, [search, onlyOpen, isHiring]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPublicRestaurants({
        name: search || undefined,
        is_open: onlyOpen ? true : undefined,
        is_hiring: isHiring ? true : undefined,
        page,
        size,
      });
    }, 400);
    return () => clearTimeout(handler);
  }, [search, onlyOpen, isHiring, page, fetchPublicRestaurants]);

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
      <div className="search-bar-wrap">
        <div className="search-bar">
          <MagnifyingGlass className="search-icon" size={18} weight="bold" />
          <input
            id="restaurant-search"
            type="search"
            placeholder="Поиск ресторана или адреса..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Поиск ресторана"
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: "10px",
            flexWrap: "wrap",
          }}
        >
          <label className="form-check" style={{ width: "fit-content" }}>
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(e) => setOnlyOpen(e.target.checked)}
            />
            <span className="form-check-label">Только открытые</span>
          </label>
          <label className="form-check" style={{ width: "fit-content" }}>
            <input
              type="checkbox"
              checked={isHiring}
              onChange={(e) => setIsHiring(e.target.checked)}
            />
            <span
              className="form-check-label"
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <Briefcase size={13} weight="bold" /> Набор сотрудников
            </span>
          </label>
        </div>
      </div>

      <div className="restaurants-section">
        <div className="section-header">
          <Storefront size={20} weight="bold" color="var(--fire)" />
          <h1 className="section-title">Все заведения</h1>
          <span
            className="text-muted"
            style={{ fontSize: "0.8rem", fontWeight: 600 }}
          >
            {publicRestaurants.length}
          </span>
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : publicRestaurants.length === 0 ? (
          <EmptyState
            title="Ничего не найдено"
            subtitle="Попробуйте другой поиск или фильтр"
            action={{
              label: "Сбросить",
              onClick: () => {
                setSearch("");
                setOnlyOpen(false);
                setIsHiring(false);
              },
            }}
          />
        ) : (
          <>
            <div className="restaurants-grid">
              {publicRestaurants.map((r) => (
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
