import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlass,
  SortAscending,
  SortDescending,
  Star,
  ChartBar,
  ForkKnife,
} from "@phosphor-icons/react";
import { useRestaurantStore } from "../../store/useRestaurantStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useShallow } from "zustand/react/shallow";
import RestaurantCard from "@shared/components/RestaurantCard/RestaurantCard";
import EmptyState from "@shared/components/EmptyState/EmptyState";
import s from "./HomePage.module.css";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 17) return "Добрый день";
  return "Добрый вечер";
};

const SIZE = 20;

const HomePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sort, setSort] = useState("default");
  const [direction, setDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  const { publicRestaurants, loading, publicRestaurantsTotal, fetchPublicRestaurants } =
    useRestaurantStore(
      useShallow((s) => ({
        publicRestaurants: s.publicRestaurants,
        loading: s.loading,
        publicRestaurantsTotal: s.publicRestaurantsTotal,
        fetchPublicRestaurants: s.fetchPublicRestaurants,
      })),
    );

  useEffect(() => {
    setSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setSearching(false);
    }, 380);
    return () => {
      clearTimeout(timer);
      setSearching(false);
    };
  }, [search]);

  const resetAndLoad = useCallback(() => {
    setAllRestaurants([]);
    setPage(1);
    setHasMore(true);
  }, []);

  useEffect(() => {
    resetAndLoad();
  }, [debouncedSearch, onlyOpen, sort, direction, resetAndLoad]);

  const load = useCallback(() => {
    fetchPublicRestaurants({
      name: debouncedSearch || undefined,
      is_open: onlyOpen ? true : undefined,
      sort,
      direction,
      page,
      size: SIZE,
    });
  }, [debouncedSearch, onlyOpen, sort, direction, page, fetchPublicRestaurants]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (page === 1) {
      setAllRestaurants(publicRestaurants);
    } else {
      setAllRestaurants((prev) => {
        const ids = new Set(prev.map((r) => r.id));
        return [...prev, ...publicRestaurants.filter((r) => !ids.has(r.id))];
      });
    }
    const total = publicRestaurantsTotal || 0;
    setHasMore(page * SIZE < total);
  }, [publicRestaurants, publicRestaurantsTotal, page]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  const firstName = user?.first_name || user?.name?.split(" ")[0] || "";

  return (
    <div className={s.page}>
      {firstName && (
        <div className={s.greeting}>
          <div className={s.greetingLabel}>
            {getGreeting()} <ForkKnife size={12} weight="fill" style={{ display: "inline", verticalAlign: "middle" }} />
          </div>
          <div className={s.greetingName}>{firstName}</div>
        </div>
      )}

      <div className={s.searchWrap}>
        <div className={s.search}>
          <MagnifyingGlass size={17} className={s.searchIcon} />
          <input
            type="search"
            placeholder="Поиск заведения..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
          {searching && <span className={s.searchSpinner} aria-hidden="true" />}
        </div>

        <div className={s.sortPanel}>
          <button
            type="button"
            className={`${s.sortChip}${sort === "default" ? ` ${s.active}` : ""}`}
            onClick={() => { setSort("default"); }}
          >
            По умолчанию
          </button>
          <button
            type="button"
            className={`${s.sortChip}${sort === "rating" ? ` ${s.active}` : ""}`}
            onClick={() => { setSort("rating"); }}
          >
            <Star size={13} weight="fill" /> Оценка
          </button>
          <button
            type="button"
            className={`${s.sortChip}${sort === "popularity_7d" ? ` ${s.active}` : ""}`}
            onClick={() => { setSort("popularity_7d"); }}
          >
            <ChartBar size={13} weight="bold" /> Популярное
          </button>
          {sort !== "default" && (
            <button
              type="button"
              className={`${s.sortChip} ${s.sortChipIcon}`}
              onClick={() => {
                setDirection((v) => (v === "desc" ? "asc" : "desc"));
              }}
              aria-label="Направление сортировки"
            >
              {direction === "desc" ? (
                <SortDescending size={15} weight="bold" />
              ) : (
                <SortAscending size={15} weight="bold" />
              )}
            </button>
          )}
          <button
            type="button"
            className={`${s.sortChip}${onlyOpen ? ` ${s.active}` : ""}`}
            onClick={() => { setOnlyOpen((v) => !v); }}
          >
            Открытые
          </button>
        </div>
      </div>

      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h1 className={s.sectionTitle}>Заведения</h1>
          {publicRestaurantsTotal > 0 && (
            <span style={{ fontSize: "0.82rem", color: "var(--text-3)", fontWeight: 600 }}>
              {publicRestaurantsTotal}
            </span>
          )}
        </div>

        {loading && allRestaurants.length === 0 ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : allRestaurants.length === 0 ? (
          <EmptyState
            title="Ничего не найдено"
            subtitle="Попробуйте другой запрос или уберите фильтры"
          />
        ) : (
          <>
            <div className={s.grid}>
              {allRestaurants.map((r) => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  onClick={() =>
                    navigate(`/restaurant/${r.display_id || r.id}`, {
                      state: { restaurant: r },
                    })
                  }
                />
              ))}
            </div>

            <div ref={sentinelRef} style={{ height: 1, marginTop: 8 }} />

            {loading && allRestaurants.length > 0 && (
              <div className="loading-center" style={{ minHeight: 64 }}>
                <div className="spinner" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
