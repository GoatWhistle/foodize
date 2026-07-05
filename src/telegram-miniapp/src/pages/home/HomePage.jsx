import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlass,
  SortAscending,
  SortDescending,
  Star,
  ChartBar,
  ForkKnife,
} from "@phosphor-icons/react";
import { useAuthStore } from "../../store/useAuthStore";
import { useFavoriteStore } from "../../store/useFavoriteStore";
import { useShallow } from "zustand/react/shallow";
import RestaurantCard from "@shared/components/RestaurantCard/RestaurantCard";
import EmptyState from "@shared/components/EmptyState/EmptyState";
import { useHomePageLogic } from "@shared/hooks/useHomePageLogic.js";
import { getGreeting } from "@shared/utils/restaurant.js";
import { aiOrderService } from "../../services/aiOrderService";
import s from "./HomePage.module.css";

const HomePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { favoriteIds, toggle: toggleFavorite } = useFavoriteStore(
    useShallow((s) => ({ favoriteIds: s.favoriteIds, toggle: s.toggle }))
  );

  const {
    search, setSearch,
    searching,
    onlyOpen, setOnlyOpen,
    sort, setSort,
    direction, setDirection,
    allRestaurants,
    hasMore,
    loading,
    publicRestaurantsTotal,
    sentinelRef,
  } = useHomePageLogic({ pageSize: 20, infiniteScroll: true });

  const firstName = user?.first_name || user?.name?.split(" ")[0] || "";

  const askAiAssistant = async () => {
    let reply = "";
    try {
      await aiOrderService.streamChat(
        [{ role: "user", content: "Что можно заказать быстро и недорого?" }],
        { onChunk: (chunk) => { reply += chunk; } }
      );
      window.alert(reply || "Ответ пуст");
    } catch (err) {
      window.alert("Не удалось получить ответ ассистента");
    }
  };

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
          <button
            type="button"
            className={s.sortChip}
            onClick={askAiAssistant}
          >
            AI-помощник
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
                    navigate(`/restaurant/${r.display_id}`, {
                      state: { restaurant: r },
                    })
                  }
                  isFavorite={favoriteIds.includes(r.id)}
                  onFavoriteToggle={toggleFavorite}
                  viewTransition={false}
                  favPosition="bottom"
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
