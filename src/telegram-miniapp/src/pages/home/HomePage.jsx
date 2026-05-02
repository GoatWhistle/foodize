import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { useShallow } from "zustand/react/shallow";
import RestaurantCard from "../../components/ui/RestaurantCard";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";

const HomePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [page, setPage] = useState(1);
  const size = 20;

  const {
    publicRestaurants,
    loading,
    publicRestaurantsTotal,
    fetchPublicRestaurants,
  } = useRestaurantStore(
    useShallow((s) => ({
      publicRestaurants: s.publicRestaurants,
      loading: s.loading,
      publicRestaurantsTotal: s.publicRestaurantsTotal,
      fetchPublicRestaurants: s.fetchPublicRestaurants,
    })),
  );
  const totalPages = Math.ceil(publicRestaurantsTotal / size) || 1;

  const load = useCallback(() => {
    fetchPublicRestaurants({
      name: search || undefined,
      is_open: onlyOpen ? true : undefined,
      page,
      size,
    });
  }, [search, onlyOpen, page, fetchPublicRestaurants]);

  useEffect(() => {
    const timer = setTimeout(load, 350);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <div className="home-page">
      <div className="search-bar-wrap">
        <div className="search-bar">
          <MagnifyingGlass size={18} className="search-icon" />
          <input
            type="search"
            placeholder="Поиск ресторана..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
            fontSize: "0.85rem",
            color: "var(--text-2)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={onlyOpen}
            onChange={(e) => {
              setOnlyOpen(e.target.checked);
              setPage(1);
            }}
          />
          Только открытые
        </label>
      </div>

      <div className="restaurants-section">
        <div className="section-header">
          <h1 className="section-title">Заведения</h1>
          {publicRestaurantsTotal > 0 && (
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--text-3)",
                fontWeight: 600,
              }}
            >
              {publicRestaurantsTotal}
            </span>
          )}
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : publicRestaurants.length === 0 ? (
          <EmptyState
            title="Ничего не найдено"
            subtitle="Попробуйте другой поиск или уберите фильтры"
          />
        ) : (
          <>
            <div className="restaurants-grid">
              {publicRestaurants.map((r) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  onClick={() =>
                    navigate(`/restaurant/${r.id}`, {
                      state: { restaurant: r },
                    })
                  }
                />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
